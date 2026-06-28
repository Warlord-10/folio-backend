// In-memory MongoDB helper for integration tests.
// Spins up a real mongod in memory (via mongodb-memory-server) so model logic,
// validators, and indexes behave exactly like production — no external DB needed.

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

async function connect() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}

// Wipe every collection between tests so each test starts from a clean slate.
async function clear() {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
}

async function close() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
}

module.exports = { connect, clear, close };
