const { logError, logInfo, logSystem } = require("../utils/logger.js");
const { redisService } = require("./redis.js");

class PubSubService {
    constructor() {
        if (PubSubService.instance) return PubSubService.instance;
        PubSubService.instance = this;

        // channel -> Set of listener callbacks. Lets many clients (e.g. SSE
        // connections in different tabs) share one Redis subscription per channel.
        this.listeners = new Map();

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

    // Registers a listener for a channel. Multiple listeners can share a single
    // Redis subscription; the underlying subscribe happens only for the first one.
    // Returns an unsubscribe function that removes just this listener.
    async subscribe(channel, callback) {
        try {
            let set = this.listeners.get(channel);

            if (!set) {
                set = new Set();
                this.listeners.set(channel, set);

                // One Redis-level listener per channel fans out to all callbacks.
                await this.subscriber.subscribe(channel, (message) => {
                    let parsed;
                    try {
                        parsed = JSON.parse(message);
                    } catch (err) {
                        logError(`PubSub parse error on channel ${channel}: ${err.message}`);
                        return;
                    }
                    for (const cb of this.listeners.get(channel) || []) {
                        try {
                            cb(parsed);
                        } catch (err) {
                            logError(`PubSub callback error on channel ${channel}: ${err.message}`);
                        }
                    }
                });
                logInfo(`Subscribed to ${channel}`);
            }

            set.add(callback);
            return () => this.unsubscribe(channel, callback);
        } catch (error) {
            logError(`Error subscribing to ${channel}. ${error}`);
            throw error;
        }
    }

    // Removes a single listener. When the last listener for a channel is removed,
    // the underlying Redis subscription is torn down. Passing no callback removes all.
    async unsubscribe(channel, callback) {
        try {
            const set = this.listeners.get(channel);
            if (!set) return;

            if (callback) set.delete(callback);
            else set.clear();

            if (set.size === 0) {
                this.listeners.delete(channel);
                await this.subscriber.unsubscribe(channel);
                logInfo(`Unsubscribed from ${channel}`);
            }
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