// Express application factory.
//
// This module builds and exports the configured Express `app` WITHOUT any
// side effects (no service connections, no HTTPS server, no process listeners).
// That keeps it importable from tests (Supertest) and from server.js alike.
// Process startup — folders, services, HTTPS, signal handlers — lives in server.js.

const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require("path");

const { apiLoggerMiddleware } = require("./middleware/apiLogger.js");
const rateLimiter = require("./middleware/rateLimiter.js");

const authRoutes = require("./routes/auth.js");
const userRoutes = require("./routes/user.js");
const projectRoutes = require("./routes/project.js");
const repoRoutes = require("./routes/repo.js");
const portfolioRoutes = require("./routes/portfolio.js");
const v2Routes = require("./routes/v2.js");
const sseRoutes = require("./routes/sseRoutes.js");

const { logSystem } = require('./utils/logger.js');
const { errorHandler } = require('./utils/errorUtils.js');

const app = express();
logSystem(`CWD: ${process.cwd()}`);

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLoggerMiddleware);
app.use(rateLimiter);
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
  return res.status(200).json({ "msg": "hello" });
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
