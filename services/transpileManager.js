const { Worker } = require('worker_threads');
const path = require('path');
const { logInfo, logError } = require('../utils/logger');
const RabbitMQClient = require('./rabbitmq');
const pubSubService = require('./pubSubService');

const MAX_WORKERS = 4;
const activeWorkers = new Set();

async function transpileManager() {
    try {
        const rabbitClient = RabbitMQClient.getInstance();
        
        const channel = await rabbitClient.connect();
        channel.prefetch(MAX_WORKERS);

        logInfo("Transpile manager initialized");

        channel.consume('transpile_jobs', async (msg) => {
            if (!msg) return;

            if (activeWorkers.size >= MAX_WORKERS) {
                logInfo(`Worker limit (${MAX_WORKERS}) reached. Requeueing...`);
                channel.nack(msg, false, true);
                return;
            }

            try {
                const job = JSON.parse(msg.content.toString());
                logInfo(`Received job for project: ${job.projectId}`);

                await runWorker(job);
                channel.ack(msg);
                logInfo(`Job completed for project: ${job.projectId}`);
            } catch (err) {
                logError(`Job failed: ${err}`);
                channel.nack(msg, false, false); // discard or dead-letter
            }
        });

        process.on('SIGINT', async () => {
            await rabbitClient.close();
            process.exit(0);
        });
    } catch (err) {
        logError(`Error initializing transpile manager: ${err}`);
    }
}

function runWorker(job) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'transpileWorker.js'), {
            workerData: job,
        });

        activeWorkers.add(worker);

        worker.on('message', (msg) => {
            if (msg.type === 'progress') {
                pubSubService.publish(`portfolio-logs:${projectId}`, msg.progress);
            } else if (msg.type === 'done') {
                pubSubService.publish(`portfolio-logs:${projectId}`, msg.data);
            }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            activeWorkers.delete(worker);
            if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });
    });
}

module.exports = { transpileManager };
