const amqp = require('amqplib');

async function connectRabbitMQ(url, queueName, options={durable: true}) {
    let MAX_RETRIES = 5;
    while(MAX_RETRIES > 0){
        try {
            const connection = await amqp.connect(url);
            const channel = await connection.createChannel();
            await channel.assertQueue(queueName, options);

            // if (connection && channel) {
            //     return {connection, channel};
            // } else {
            //     throw new Error('Failed to establish RabbitMQ connection');
            // }
            
            return {connection, channel};
        } catch (error) {
            console.error(`Failed to connect to RabbitMQ, retrying... (${MAX_RETRIES} attempts left)`);
            const timeout = Math.pow(2, 5 - MAX_RETRIES) * 1000; // Exponential backoff starting at 1s
            await new Promise(resolve => setTimeout(resolve, timeout));
            MAX_RETRIES--;
        }
    }
}

async function disconnectRabbitMQ(connection, channel) {
    await channel.close();
    await connection.close();
}

module.exports = { 
    connectRabbitMQ, 
    disconnectRabbitMQ 
};