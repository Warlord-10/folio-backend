const { startDatabase } = require("./mongodb");
const { redisService } = require("./redis");
const { transpileManager } = require("./transpileManager");

const pubSubService = require("./pubSubService");
const RabbitMQClient = require("./rabbitmq")

async function initiateServices(){
    try {
        await redisService.ready;
        await pubSubService.ready;

        await RabbitMQClient.getInstance().connect();

        await transpileManager();
        await startDatabase();

        return "All services started successfully";
    } catch (error) {
        console.log(error)
    }
} 

module.exports = { initiateServices };