// Manual mock for services/redis.js (activated by jest.mock("../../services/redis.js")).
// Backs get/set/del with an in-memory Map so stateful flows (e.g. the refresh-token
// session store) round-trip correctly. incr is a constant 1 so the rate limiter
// never trips during tests.

const store = new Map();

// Minimal glob -> RegExp (only "*" is supported, which is all our patterns use).
function globToRegExp(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`);
}

const fakeClient = {
    get: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    set: jest.fn(async (key, value) => { store.set(key, value); return "OK"; }),
    del: jest.fn(async (keys) => {
        const list = Array.isArray(keys) ? keys : [keys];
        let n = 0;
        for (const k of list) if (store.delete(k)) n++;
        return n;
    }),
    incr: jest.fn(async () => 1),        // rate limiter: always "first request in window"
    expire: jest.fn(async () => true),
    ttl: jest.fn(async () => 60),
    ping: jest.fn(async () => "PONG"),
    scanIterator: jest.fn(({ MATCH } = {}) => {
        const re = MATCH ? globToRegExp(MATCH) : /.*/;
        const keys = [...store.keys()].filter((k) => re.test(k));
        return (async function* () { for (const k of keys) yield k; })();
    }),
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

// Test helper: wipe the in-memory store between tests.
function __clearStore() {
    store.clear();
}

module.exports = { redisService, __clearStore };
