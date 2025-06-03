const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const incrAsync = promisify(redisClient.incr).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

async function rateLimiter(req, res, next) {
    const ip = req.ip;
    const key = `ratelimit:${ip}`;
    
    try {
        const numRequests = await incrAsync(key);
        
        // First request, set expiry
        if (numRequests === 1) {
            await expireAsync(key, 60); // 1 minute window
        }
        
        // Rate limit: 100 requests per minute
        if (numRequests > 100) {
            return res.status(429).json({ error: 'Too many requests, please try again later' });
        }
        
        next();
    } catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Continue if Redis fails
    }
}

module.exports = rateLimiter;