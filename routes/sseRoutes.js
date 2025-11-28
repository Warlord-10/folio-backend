const express = require('express');
const { logInfo, logError } = require('../utils/logger');

const router = express.Router();
const pubSubService = require("../services/pubSubService")


router.get('/notification/:channel', async (req, res) => {
    console.log("Got an SSE request", req.params);
    const { channel } = req.params;
    const fullChannel = `portfolio-logs:${channel}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'none');
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.flushHeaders(); // flush immediately if supported
    

    // Send initial heartbeat or comment
    res.write(`data: ${JSON.stringify({ message: `Connected to ${channel}` })}\n\n`);
    const HEARTBEAT_INTERVAL = 15000; // every 15 seconds

    const heartbeat = setInterval(() => {
        res.write(`: heartbeat\n\n`);
    }, HEARTBEAT_INTERVAL);
    
    
    try {
        console.log("trying my best")
        await pubSubService.subscribe(fullChannel, (message) => {
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


    req.on('close', async () => {
        try {
            clearInterval(heartbeat);
            await pubSubService.unsubscribe(fullChannel);
            logInfo(`Client disconnected from channel: ${channel}`);
        } catch (error) {
            logError(`Error unsubscribing from channel: ${channel}`, error);
        }
    });
});


module.exports = router;