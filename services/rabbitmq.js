const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connecting = false;
        this.readyPromise = null;
        this.queues = new Set();
        this._setupGracefulShutdown();
    }

    async connect() {
        if (this.connecting) return this.readyPromise;
        this.connecting = true;
        this.readyPromise = this._connectWithRetry();
        return this.readyPromise;
    }

    async _connectWithRetry() {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672';
        const MAX_RETRIES = 5;
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                this._setupConnectionHandlers();
                return true;
            } catch (error) {
                console.error(`Failed to connect to RabbitMQ (${retries} retries left):`, error.message);
                const timeout = Math.pow(2, MAX_RETRIES - retries) * 1000;
                await new Promise(res => setTimeout(res, timeout));
                retries--;
            }
        }
        throw new Error('Could not establish RabbitMQ connection');
    }

    _setupConnectionHandlers() {
        if (!this.connection) return;
        this.connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err.message);
            this.connection = null;
            this.channel = null;
            this.connecting = false;
            // Try to reconnect
            // this.connect();
        });
        this.connection.on('close', () => {
            console.warn('RabbitMQ connection closed');
            this.connection = null;
            this.channel = null;
            this.connecting = false;
            // Try to reconnect
            // this.connect();
        });
    }

    async assertQueue(queueName, options = { durable: true }) {
        await this.connect();
        if (!this.queues.has(queueName)) {
            await this.channel.assertQueue(queueName, options);
            this.queues.add(queueName);
        }
    }

    async sendToQueue(queueName, messageObj, options = { persistent: true }) {
        if (!queueName) throw new Error('Queue name is required');
        if (!messageObj) throw new Error('Message object is required');
        await this.assertQueue(queueName);
        const buffer = Buffer.from(JSON.stringify(messageObj));
        return this.channel.sendToQueue(queueName, buffer, options);
    }

    async consume(queueName, onMessage, options = { noAck: false }) {
        if (!queueName) throw new Error('Queue name is required');
        if (typeof onMessage !== 'function') throw new Error('onMessage callback is required');
        await this.assertQueue(queueName);
        return this.channel.consume(queueName, onMessage, options);
    }

    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
        this.channel = null;
        this.connection = null;
        this.connecting = false;
    }

    _setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            await this.close();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await this.close();
            process.exit(0);
        });
    }
}

const rabbitMQService = new RabbitMQService();
module.exports = rabbitMQService;
