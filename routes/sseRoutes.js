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
    
    
    let unsubscribe = null;
    try {
        // subscribe() returns a handle that removes only THIS client's listener,
        // so one client disconnecting won't tear the channel down for others.
        unsubscribe = await pubSubService.subscribe(fullChannel, (message) => {
            try {
                res.write(`data: ${JSON.stringify({ message: message })}\n\n`);
            } catch (error) {
                logError(`Error sending SSE message: ${error}`);
            }
        });

        logInfo(`Client subscribed to channel: ${channel}`);
    } catch (error) {
        logError(`Error in SSE connection: ${error}`);
        clearInterval(heartbeat);
        return res.end();
    }


    req.on('close', async () => {
        try {
            clearInterval(heartbeat);
            if (unsubscribe) await unsubscribe();
            logInfo(`Client disconnected from channel: ${channel}`);
        } catch (error) {
            logError(`Error unsubscribing from channel: ${channel}`, error);
        }
    });
});


module.exports = router;