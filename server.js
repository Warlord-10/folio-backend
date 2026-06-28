// Process entry point.
//
// Owns everything with side effects: filesystem bootstrap, service connections,
// the HTTPS server, and signal handlers. The Express app itself is built in
// app.js (side-effect free) so it can be imported by tests without booting here.

const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = require('./app.js');
const { initiateServices } = require('./services/serviceManager');
const { createFolder } = require('./utils/fileManager.js');
const { logSystem } = require('./utils/logger.js');

createFolder(process.env.BUNDLED_PROJECT_DEST);  // It stores project bundles of each user
createFolder(process.env.USER_FILE_DEST);        // It stores the user files
createFolder(process.env.PROJECT_FILE_DEST);     // It stores the project files of the projects

// Starting essential services
initiateServices();

let httpsServer;
if (process.env.MODE == "dev") {
  logSystem("Running in DEV mode");
  const options = {
    key: fs.readFileSync(`./certificates/localhost-key.pem`),
    cert: fs.readFileSync(`./certificates/localhost.pem`)
  };

  httpsServer = https.createServer(options, app);
  httpsServer.listen(process.env.PORT, () => {
    logSystem(`server running in DEV: ${Date.now()}`);
  });
}

else {
  logSystem("Running in PROD mode");
  const options = {
    key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.BACKEND_DOMAIN}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.BACKEND_DOMAIN}/fullchain.pem`)
  };

  httpsServer = https.createServer(options, app);
  httpsServer.listen(process.env.PORT, () => {
    logSystem(`server running in PROD: ${Date.now()}`);
  });
}

process.on("SIGINT", () => {
  logSystem("Shutting down server...");
  httpsServer.close(() => {
    logSystem("Server closed.");
    process.exit(0);
  });
});

module.exports = app;
