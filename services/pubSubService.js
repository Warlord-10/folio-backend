const { logError, logInfo, logSystem } = require("../utils/logger.js");
const { redisService } = require("./redis.js");

class PubSubService {
    constructor() {}

    async connect() {
        try {
            this.publisher = await redisService.getDuplicateClient(1);
            this.subscriber = await redisService.getDuplicateClient(1);
            
            logInfo("PubSub initialized. Publisher: " + this.publisher.isOpen + ", Subscriber: " + this.subscriber.isOpen);

            return 0;
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
                const parsedMessage = JSON.parse(message);
                callback(parsedMessage);
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
}

const pubSubService = new PubSubService();

module.exports = pubSubService;