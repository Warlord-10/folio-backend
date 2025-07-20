const { logError, logInfo, logSystem } = require("../utils/logger.js");
const { redisService } = require("./redis.js");

class PubSubService {
    constructor() {
        if (PubSubService.instance) return PubSubService.instance;
        PubSubService.instance = this;

        this.ready = this.connect();
    }

    async connect() {
        try {
            this.publisher = await redisService.getDuplicateClient(1);
            this.subscriber = await redisService.getDuplicateClient(1);

            logInfo("PubSub initialized. Publisher: " + this.publisher.isOpen + ", Subscriber: " + this.subscriber.isOpen);

            return true;
        } catch (error) {
            logSystem(error.toString(), "PUBSUB");
            throw error;
        }
    }

    async publish(channel, message) {
        try {
            await this.publisher.publish(channel, JSON.stringify(message));
            logInfo(`Published message to ${channel}`);
        } catch (error) {
            logError(`Error publishing to ${channel}. ${error}`);
            throw error;
        }
    }

    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel, (message) => {
                try {
                    const parsed = JSON.parse(message);
                    callback(parsed);
                } catch (err) {
                    logError(`PubSub callback error on channel ${channel}: ${err.message}`);
                }
            });
            logInfo(`Subscribed to ${channel}`);
        } catch (error) {
            logError(`Error subscribing to ${channel}. ${error}`);
            throw error;
        }
    }

    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
            logInfo(`Unsubscribed from ${channel}`);
        } catch (error) {
            logError(`Error unsubscribing from ${channel}. ${error}`);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.publisher?.isOpen) await this.publisher.quit();
            if (this.subscriber?.isOpen) await this.subscriber.quit();
            logInfo('PubSub connections closed');
        } catch (err) {
            logError(`Error closing PubSub: ${err.message}`);
        }
    }
}

const pubSubService = new PubSubService();
module.exports = pubSubService;