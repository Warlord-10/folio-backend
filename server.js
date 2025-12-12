// Importing required modules
const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require("path");
const https = require('https');
const fs = require('fs');
require('dotenv').config();
const { initiateServices } = require('./services/serviceManager');

const { apiLoggerMiddleware } = require("./middleware/apiLogger.js");

const authRoutes = require("./routes/auth.js");
const userRoutes = require("./routes/user.js");
const projectRoutes = require("./routes/project.js");
const repoRoutes = require("./routes/repo.js");
const portfolioRoutes = require("./routes/portfolio.js");
const v2Routes = require("./routes/v2.js");
const sseRoutes = require("./routes/sseRoutes.js");


// const { transpileManager } = require('./services/transpileManager.js');
const { createFolder } = require('./utils/fileManager.js');
const { logSystem } = require('./utils/logger.js');
// const { startDatabase } = require('./services/mongodb.js');
// const { connectRedis } = require('./services/redis.js');


createFolder(process.env.BUNDLED_PROJECT_DEST)  // It stores project bundles of each user
createFolder(process.env.USER_FILE_DEST)  // It stores the user files
createFolder(process.env.PROJECT_FILE_DEST) // It stores the project files of the projects 


// Starting essential services
initiateServices();


// Creating an Express application
const app = express();
logSystem(`CWD: ${process.cwd()}`)


// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLoggerMiddleware);
app.use(cors({
  origin: [
    // Localhost
    "http://localhost:3000",

    // Dev domains
    "https://folio.test:3000",
    "https://localhost:3000",

    // Prod domains
    "https://folio-fullstack.vercel.app",
    "https://foli0.vercel.app",
    "https://folio-git-main-warlord-10s-projects.vercel.app",
    "https://folio-warlord-10s-projects.vercel.app",
  ],  // allows request from 3000, true/* indicate all origin
  methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
  credentials: true,
}));


// Routes
// Default soft authorization
app.use((req, res, next) => {
  req.user = null;
  next();
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/repo", repoRoutes);
app.use("/portfolio", portfolioRoutes);

app.use("/v2", v2Routes);
app.use("/events", sseRoutes);
// app.use("/git")


// Static Routes
app.use("/bundle", (req, res, next) => {
  logSystem(`Request for bundle: ${req.originalUrl}, ${JSON.stringify(req.params)}`);
  next();
}, express.static(path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST)));

app.use("/public", (req, res, next) => {
  logSystem(`Request for public file: ${req.originalUrl}`);
  next();
}, express.static(path.join(process.cwd(), process.env.USER_FILE_DEST)));

app.use("/banner", (req, res, next) => {
  logSystem(`Request for banner: ${req.originalUrl}`);
  next();
}, express.static(path.join(process.cwd(), process.env.PROJECT_FILE_DEST)));

// For testing only
app.get("/test", (req, res) => {
  return res.status(200).json({ "msg": "hello" })
})
// app.use("/temp", (req, res, next) => {
//   logSystem(`Request for temp: ${req.originalUrl}`);
//   next();
// }, express.static(path.join(process.cwd())));


if (process.env.MODE == "dev") {
  logSystem("Running in DEV mode");
  const options = {
    key: fs.readFileSync(`./certificates/localhost-key.pem`),
    cert: fs.readFileSync(`./certificates/localhost.pem`)
  };

  const httpsServer = https.createServer(options, app)
  httpsServer.listen(process.env.PORT, () => {
    logSystem(`server running in DEV: ${Date.now()}`);
  })
}

else {
  logSystem("Running in PROD mode");
  const options = {
    key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.BACKEND_DOMAIN}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.BACKEND_DOMAIN}/fullchain.pem`)
  };

  const httpsServer = https.createServer(options, app)
  httpsServer.listen(process.env.PORT, () => {
    logSystem(`server running in PROD: ${Date.now()}`);
  })
}

process.on("SIGINT", () => {
  logSystem("Shutting down server...");
  httpsServer.close(() => {
    logSystem("Server closed.");
    process.exit(0);
  });
});

module.exports = app;


// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { renderToString } from "react-dom/server";
// import Home from "./home.jsx"


// const domNode = document.getElementById("userPageRoot");
// ReactDOM.createRoot(domNode).render(<Home />);


// // const rootElement = document.getElementById("userPageRoot");
// // const rootString = renderToString(<Home />);
// // rootElement.innerHTML = rootString;
// // const root = ReactDOM.hydrateRoot(rootElement, <Home />);
