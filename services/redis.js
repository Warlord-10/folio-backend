const { createClient } = require('redis');
const { logInfo, logError, logSystem } = require('../utils/logger.js'); // Optional logging

class RedisService {
  constructor() {
    if (RedisService.instance) return RedisService.instance;

    this.redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    this.redisClient.on('error', (err) => {
      logSystem(err.toString(), "REDIS");
    });

    RedisService.instance = this;
  }

  async connect() {
    if (!this.redisClient) throw new Error('Redis client not initialized');

    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
      await this.redisClient.ping();
      logInfo('Redis initialized');
    }

    return 0;
  }

  async getDuplicateClient(index=0) {
    if (!this.redisClient) throw new Error('Redis client not initialized');
    const dup = this.redisClient.duplicate();
    await dup.connect();
    await dup.select(index); // Optional
    return dup;
  }

  getClient() {
    if (!this.redisClient) throw new Error('Redis client not initialized');
    return this.redisClient;
  }
}

// Export singleton instance
const redisService = new RedisService();

module.exports = {
  redisService
};
