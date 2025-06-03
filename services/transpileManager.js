const { Worker } = require('worker_threads');
const path = require('path');
const { logInfo, logError } = require('../utils/logger');
const { connectRabbitMQ, disconnectRabbitMQ } = require('./rabbitmq');



// Maximum number of worker threads to use
const MAX_WORKERS = 4;

// Track active workers
const activeWorkers = new Set();


async function transpileManager() {
    try {
        // Connect to RabbitMQ
        const {connection, channel} = await connectRabbitMQ(
            'amqp://user:password@rabbitmq:5672', 
            'transpile_jobs'
        )
        logInfo("Transpile manager initialized");
        channel.prefetch(4);    // Adjust the prefetch count as needed
        
        // Start consuming messages
        channel.consume('transpile_jobs', async (msg) => {
            if(!msg) return;

            // Check if we can start a new worker
            if (activeWorkers.size >= MAX_WORKERS) {
                logInfo(`Maximum worker count reached (${MAX_WORKERS}). Waiting for workers to complete...`);
                // Requeue the message with a delay
                setTimeout(() => {
                    channel.nack(msg, false, true);
                }, 5000);
                return;
            }
            
            
            try {
                const jobData = JSON.parse(msg.content.toString());
                logInfo(`Processing transpile job for project: ${jobData.projectId}`);
                
                // Process the job in a worker thread
                processJobInWorker(jobData, (result) => {
                    channel.ack(msg);
                    logInfo(`Job completed for project: ${jobData.projectId}`);
                });
            } catch (error) {
                logError(`Error processing job. ${error}`);
                channel.ack(msg);
            }
        });
        
        // Handle connection closure
        process.on('SIGINT', async () => {
            await disconnectRabbitMQ(connection, channel);
            process.exit(0);
        });
    } catch (error) {
        logError(`Error starting worker service: ${error}`);
    }
}



// Process a job in a worker thread
function processJobInWorker(job, callback) {
    const workerPath = path.join(__dirname,'transpileWorker.js');
    
    const worker = new Worker(workerPath, {
        workerData: job
    });
    
    // Add to active workers
    activeWorkers.add(worker);
    
    worker.on('message', (result) => {
        activeWorkers.delete(worker);
        callback(result);
    });
    
    worker.on('error', (err) => {
        logError(`Worker error for project ${job.projectId}:`, err);
        activeWorkers.delete(worker);
        callback({...job, status: 'failed', error: err.toString()});
    });
    
    worker.on('exit', (code) => {
        if (code !== 0) {
            logError(`Worker stopped with exit code ${code}`);
        }
        activeWorkers.delete(worker);
    });
}

module.exports = {
    transpileManager
};