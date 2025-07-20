const amqp = require('amqplib');

class RabbitMQClient {
    static instance = null;

    constructor() {
        this.connection = null;
        this.channel = null;
        this.queueName = null;

        // this.ready = this.connect();
    }

    static getInstance() {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient();
        }
        return RabbitMQClient.instance;
    }

    async connect(queueName = 'transpile_jobs', options = { durable: true }) {
        if (this.channel) return this.channel;

        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672';
        const MAX_RETRIES = 5;
        let retries = MAX_RETRIES;

        while (retries > 0) {
            try {
                this.connection = await amqp.connect(RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertQueue(queueName, options);
                this.queueName = queueName;

                this.connection.on('error', (err) => {
                    console.error('RabbitMQ connection error:', err.message);
                    this.connection = null;
                    this.channel = null;
                });

                this.connection.on('close', () => {
                    console.warn('RabbitMQ connection closed');
                    this.connection = null;
                    this.channel = null;
                });

                return this.channel;
            } catch (error) {
                console.error(`Failed to connect to RabbitMQ (${retries} retries left):`, error.message);
                const timeout = Math.pow(2, MAX_RETRIES - retries) * 1000;
                await new Promise(res => setTimeout(res, timeout));
                retries--;
            }
        }

        throw new Error('Could not establish RabbitMQ connection');
    }

    async sendToQueue(messageObj) {
        if (!this.channel || !this.queueName) {
            throw new Error('RabbitMQ is not connected. Call connect() first.');
        }

        const buffer = Buffer.from(JSON.stringify(messageObj));
        this.channel.sendToQueue(this.queueName, buffer, { persistent: true });
    }

    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
        this.channel = null;
        this.connection = null;
    }
}

module.exports = RabbitMQClient;
