// Manual mock for services/pubSubService.js — no real Redis pub/sub in tests.
module.exports = {
    ready: Promise.resolve(true),
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(() => {}), // returns an unsubscribe fn
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
};
