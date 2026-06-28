const { redisService } = require("../services/redis.js");
const { logError, logInfo } = require("./logger.js");

// Centralized cache key builders so invalidation stays consistent across controllers.
const cacheKeys = {
    user: (uid) => `user:${uid}`,
    userProjects: (uid) => `projects:user:${uid}`,
    project: (pid) => `project:${pid}`,
    projectByName: (uid, pname) => `project:${uid}:${pname}`,
    projectLanguages: (uid, pname) => `project:lang:${uid}:${pname}`,
    portfolioPage: (page, limit) => `portfolio:page:${page}:${limit}`,
};

// Returns a connected client or null. Never throws so a cache outage can't break a request.
function getClientSafe() {
    try {
        return redisService.getClient();
    } catch (err) {
        logError(`Cache unavailable: ${err.message}`);
        return null;
    }
}

// Reads and JSON-parses a cached value. Returns null on miss or any failure.
async function getCache(key) {
    const client = getClientSafe();
    if (!client) return null;
    try {
        const raw = await client.get(key);
        if (raw == null) return null;
        logInfo(`Cache hit: ${key}`);
        return JSON.parse(raw);
    } catch (err) {
        logError(`Cache get failed for ${key}: ${err.message}`);
        return null;
    }
}

// Writes a value with a TTL (seconds). Best-effort; failures are swallowed.
async function setCache(key, value, ttlSeconds = 300) {
    const client = getClientSafe();
    if (!client) return;
    try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
        logError(`Cache set failed for ${key}: ${err.message}`);
    }
}

// Deletes one or more keys. Accepts a string or an array of strings.
async function delCache(keys) {
    const client = getClientSafe();
    if (!client) return;
    const list = Array.isArray(keys) ? keys.filter(Boolean) : [keys];
    if (list.length === 0) return;
    try {
        await client.del(list);
    } catch (err) {
        logError(`Cache del failed for ${list.join(",")}: ${err.message}`);
    }
}

// Deletes every key matching a glob pattern (e.g. "portfolio:page:*").
// Uses SCAN to avoid blocking Redis on large keyspaces.
async function delByPattern(pattern) {
    const client = getClientSafe();
    if (!client) return;
    try {
        const toDelete = [];
        for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
            toDelete.push(key);
        }
        if (toDelete.length) await client.del(toDelete);
    } catch (err) {
        logError(`Cache delByPattern failed for ${pattern}: ${err.message}`);
    }
}

// Cache-aside helper: return cached value or run loader(), cache it, and return it.
async function wrap(key, ttlSeconds, loader) {
    const cached = await getCache(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    if (fresh !== null && fresh !== undefined) {
        await setCache(key, fresh, ttlSeconds);
    }
    return fresh;
}

module.exports = {
    cacheKeys,
    getCache,
    setCache,
    delCache,
    delByPattern,
    wrap,
};
