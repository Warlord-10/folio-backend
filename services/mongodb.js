const db = require("mongoose");
const { logInfo } = require("../utils/logger");

async function startDatabase(){
    const dbInstance = await db.connect(process.env.DB_URL);
    logInfo("Database connected");
    return dbInstance;
}

module.exports = {
    startDatabase
};