// Importing required modules
const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require("path");
const https = require('https');
const fs = require('fs');


const authRoutes = require("./routes/auth.js");
const userRoutes = require("./routes/user.js");
const projectRoutes = require("./routes/project.js");
const repoRoutes = require("./routes/repo.js");
const { startDatabase } = require('./mongodb.js');

require('dotenv').config();


// Creating an Express application
const app = express();  


// DB connect
startDatabase(process.env.DB_URL)


// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true,  // allows request from 3000, true/* indicate all origin
  methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
  credentials: true,
}));


// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/repo", repoRoutes);

app.use("/test", express.static(path.join(__dirname, 'bundles')));
app.use("/public", express.static(path.join(__dirname, 'public')));


const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/deepanshu.malaysingh.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/deepanshu.malaysingh.com/fullchain.pem')
};

https.createServer(options, app).listen(3005)

// const server = app.listen(process.env.PORT || 3005, ()=>{
//   console.log("server running: " + Date.now());
// })
const host = server.address();
console.log(host)

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
