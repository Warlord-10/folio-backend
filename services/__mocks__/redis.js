// Manual mock for services/redis.js (activated by jest.mock("../../services/redis.js")).
// Returns a fake client whose reads always miss — so caching becomes a transparent
// pass-through to Mongo and the rate limiter sees a low count and lets requests through.

const fakeClient = {
    get: jest.fn().mockResolvedValue(null),     // always a cache miss
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),       // rate limiter: first request in window
    expire: jest.fn().mockResolvedValue(true),
    ttl: jest.fn().mockResolvedValue(60),
    ping: jest.fn().mockResolvedValue("PONG"),
    scanIterator: jest.fn(() => (async function* () {})()),
    isOpen: true,
};

const duplicateClient = {
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    isOpen: true,
};

const redisService = {
    ready: Promise.resolve(true),
    getClient: jest.fn(() => fakeClient),
    getDuplicateClient: jest.fn().mockResolvedValue(duplicateClient),
    disconnectClient: jest.fn().mockResolvedValue(undefined),
};

module.exports = { redisService };
