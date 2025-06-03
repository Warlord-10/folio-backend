const { startDatabase } = require("./mongodb");
const { redisService } = require("./redis");
const { transpileManager } = require("./transpileManager");

const pubSubService = require("./pubSubService");

async function initiateServices(){
    try {
        await redisService.connect();
        await pubSubService.connect();

        // await pubSubService.subscribe("test", (data) => {
        //     console.log("Received message: " + data);
        // })
        // await pubSubService.publish("test", {test: "test"});

        await transpileManager();
        await startDatabase();

        return "All services started successfully";
    } catch (error) {
        console.log(error)
    }
} 

module.exports = { initiateServices };