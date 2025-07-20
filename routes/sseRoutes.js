const express = require('express');
const { logInfo, logError } = require('../utils/logger');

const router = express.Router();
const pubsub = require("../services/pubSubService")


router.get('/notification/:channel', async (req, res) => {
    console.log("Got an SSE request", req.params);
    const { channel } = req.params;
    const fullChannel = `portfolio-logs:${channel}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'none');
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.flushHeaders(); // flush immediately if supported

    
    req.on('close', async () => {
        clearInterval(heartbeat);
        try {
            await pubsub.unsubscribe(fullChannel);
            logInfo(`Client disconnected from channel: ${channel}`);
        } catch (error) {
            logError(`Error unsubscribing from channel: ${channel}`, error);
        }
    });
    
    // Send initial heartbeat or comment
    res.write(`data: ${JSON.stringify({ message: `Connected to ${channel}` })}\n\n`);
    console.log("sent something");
    
    
    try {
        console.log("trying my best")
        // if (!pubsub.isOpen) {
        //     console.log("connecting")
        //     await pubsub.connect();
        // }

        await pubsub.subscribe(fullChannel, (message) => {
            try {
                console.log("got a message")
                res.write(`data: ${JSON.stringify({ message: message })}\n\n`);
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