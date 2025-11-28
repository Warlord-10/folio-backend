const { startDatabase } = require("./mongodb");
const { redisService } = require("./redis");
const { transpileManager } = require("./transpileManager");

const pubSubService = require("./pubSubService");
const rabbitMQService = require("./rabbitmq")

async function initiateServices(){
    try {
        await redisService.ready;
        await pubSubService.ready;

        await rabbitMQService.readyPromise;

        await transpileManager();
        await startDatabase();

        return "All services started successfully";
    } catch (error) {
        console.log(error)
    }
} 

module.exports = { initiateServices };