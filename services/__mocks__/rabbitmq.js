// Manual mock for services/rabbitmq.js — no real broker connection in tests.
module.exports = {
    readyPromise: Promise.resolve(true),
    channel: { prefetch: jest.fn(), ack: jest.fn(), nack: jest.fn() },
    connect: jest.fn().mockResolvedValue(true),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    sendToQueue: jest.fn().mockResolvedValue(true),
    consume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
};
