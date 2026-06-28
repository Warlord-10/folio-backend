const { redisService } = require("../services/redis.js");
const { logError } = require("../utils/logger.js");

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

// Fixed-window rate limiter backed by the shared Redis client (node-redis v4/v5 API).
// Fails open: if Redis is unavailable the request is allowed through.
async function rateLimiter(req, res, next) {
    let client;
    try {
        client = redisService.getClient();
    } catch (err) {
        return next(); // Redis down -> don't block traffic
    }

    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `ratelimit:${ip}`;

    try {
        const numRequests = await client.incr(key);

        // First request in the window -> set the expiry.
        if (numRequests === 1) {
            await client.expire(key, WINDOW_SECONDS);
        }

        if (numRequests > MAX_REQUESTS) {
            const ttl = await client.ttl(key);
            res.set("Retry-After", String(ttl > 0 ? ttl : WINDOW_SECONDS));
            return res.status(429).json({ error: "Too many requests, please try again later" });
        }

        return next();
    } catch (error) {
        logError(`Rate limiting error: ${error.message}`);
        return next(); // Fail open
    }
}

module.exports = rateLimiter;
