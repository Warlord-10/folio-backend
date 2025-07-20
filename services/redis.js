const { createClient } = require('redis');
const { logSystem } = require('../utils/logger');

class RedisService {
  constructor() {
    if (RedisService.instance) return RedisService.instance;
    RedisService.instance = this;

    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    this.redisClient = createClient({ url: `redis://${host}:${port}` });

    this.redisClient.on('error', (err) => {
      logSystem(`[Redis Error] ${err.message}`, 'REDIS');
    });

    this.ready = this.connectClient();
  }

  getClient() {
    if (!this.redisClient || !this.redisClient.isOpen) {
      throw new Error('Redis client not connected');
    }
    return this.redisClient;
  }

  async connectClient() {
    try {
      await this.redisClient.connect();
      await this.redisClient.ping();
      logSystem('Redis connected successfully', 'REDIS');
      return true;
    } catch (err) {
      logSystem(`Failed to connect to Redis: ${err.message}`, 'REDIS');
      throw err;
    }
  }

  async getDuplicateClient(index = 0) {
    try {
      const dup = this.redisClient.duplicate();
      await dup.connect();
      await dup.select(index);
      return dup;
    } catch (error) {
      throw new Error(`Failed to get duplicate client: ${error.message}`);
    }
  }

  async disconnectClient() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.disconnect();
      logSystem('Redis disconnected', 'REDIS');
    }
  }
}

const redisService = new RedisService();
module.exports = { redisService };