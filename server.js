// Importing required modules
const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require("path");
const https = require('https');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();


const authRoutes = require("./routes/auth.js");
const userRoutes = require("./routes/user.js");
const projectRoutes = require("./routes/project.js");
const repoRoutes = require("./routes/repo.js");
const portfolioRoutes = require("./routes/portfolio.js");
const v2Routes = require("./routes/v2.js");

const { startDatabase } = require('./utils/mongodb.js');
const { createFolder } = require('./utils/fileManager.js');


// Creating an Express application
createFolder(process.env.BUNDLED_PROJECT_DEST)  // It stores project bundles of each user
createFolder(process.env.USER_FILE_DEST)  // It stores the user files
createFolder(process.env.PROJECT_FILE_DEST) // It stores the project files of the projects 
const app = express();  

// DB connect
startDatabase(process.env.DB_URL)


// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://folio-fullstack.vercel.app", 
    "https://foli0.vercel.app", 
    "https://folio-git-main-warlord-10s-projects.vercel.app", 
    "https://folio-warlord-10s-projects.vercel.app",
  ],  // allows request from 3000, true/* indicate all origin
  methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
  credentials: true,
}));


// Session
app.use(session({
  secret: process.env.MODE == "dev" ? "session-key" : process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.MODE === "dev" ? false : true, // Set to true in production if using HTTPS
    maxAge: 1000 * 60 * 60 * 24, // Session lifetime (24 hours)
    sameSite: "none",
    httpOnly: true,
  },
}));


// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/repo", repoRoutes);
app.use("/portfolio", portfolioRoutes);

app.use("/v2", v2Routes);
// app.use("/git")

app.use("/bundle", express.static(path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST)));
app.use("/public", express.static(path.join(process.cwd(), process.env.USER_FILE_DEST)));
app.use("/banner", express.static(path.join(process.cwd(), process.env.PROJECT_FILE_DEST)));

// For testing only
app.get("/test", (req, res) => {
  res.send(path.join(process.cwd(), "template.html"));
})


if(process.env.MODE == "dev"){
  const server = app.listen(3005, ()=>{
    console.log("server running: " + Date.now());
  })
  const host = server.address();
  console.log(host)
}
else{
  const options = {
    key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/fullchain.pem`)
  };
  const httpsServer = https.createServer(options, app)
  httpsServer.listen(process.env.PORT, ()=>{
    console.log("server running: " + Date.now());
  })
  const address = httpsServer.address();
  console.log(address)
}

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
