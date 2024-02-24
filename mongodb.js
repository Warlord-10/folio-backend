const db = require("mongoose");

async function startDatabase(url){
    const dbInstance = await db.connect(url);
    console.log("DB Connected");
    return dbInstance;
}

module.exports = {
    startDatabase
};