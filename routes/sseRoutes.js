const express = require('express');
const { logInfo, logError } = require('../utils/logger');
const { redisClient } = require('../config/redis');


const router = express.Router();



// Create a new Redis client for subscription
const subscriber = redisClient.duplicate();

router.get('/events/:channel', async (req, res) => {
    const { channel } = req.params;

    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Send initial connection established message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Handle client disconnect
    req.on('close', async () => {
        try {
            await subscriber.unsubscribe(channel);
            logInfo(`Client disconnected from channel: ${channel}`);
        } catch (error) {
            logError(`Error unsubscribing from channel: ${channel}`, error);
        }
    });

    try {
        // Connect subscriber if not connected
        if (!subscriber.isOpen) {
            await subscriber.connect();
        }

        // Subscribe to the specified channel
        await subscriber.subscribe(channel, (message) => {
            try {
                // Send the message to the client
                res.write(`data: ${message}\n\n`);
            } catch (error) {
                logError(`Error sending SSE message: ${error}`);
            }
        });

        logInfo(`Client subscribed to channel: ${channel}`);
    } catch (error) {
        logError(`Error in SSE connection: ${error}`);
        res.end();
    }
});

module.exports = router;