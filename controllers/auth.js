const bcrypt = require('bcrypt');
const UserModel = require("../models/user");
const logger = require("../utils/logger.js");
const { setAuthCookies } = require('../utils/authUtils.js');



async function registerUser(req, res){
    try {
        console.log("registerUser");
        const user = await UserModel.create(req.body);
        
        // Generating JWT tokens
        setAuthCookies(res, user._id);

        // Saving session
        req.session.user = user;

        return res.status(201).json(user);
    } catch (error) {
        logger(error)
        return res.status(500).json('User creation failed');
    }
}

async function loginUser(req, res){
    try {
        console.log("loginUser");

        // Look into the session
        if(req.session.user){
            return res.status(200).json(req.session.user);
        }

        const user = await UserModel.findOne(
            {email: req.body.email}, "+password"
        ).lean();

        const result = await bcrypt.compare(req.body.password, user.password)
        if(result===true){
            
            // Generating JWT tokens
            setAuthCookies(res, user._id);

            // Saving session
            req.session.user = user;
            
            return res.status(200).json(user);
        }
        else{
            return res.status(401).json('Incorrect Password');
        }
    } catch (error) {
        logger(error)
        return res.status(404).json('User Not Found');
    }
}


async function getSession(req, res){
    try {
        console.log("getSession");
        if(req.session.user){
            return res.status(200).json(req.session.user);
        }
        else{
            return res.status(404).json('No Session');
        }
    } catch (error) {
        logger(error)
        return res.status(500).json('Error');
    }
}


async function logoutUser(req, res){
    try {
        console.log("logoutUser");
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        req.session.destroy();
        return res.status(200).json('Logout Successful');
    } catch (error) {
        return res.status(500).json('Logout Failed');
    }
}

module.exports = {
    registerUser,
    loginUser,
    getSession,
    logoutUser,
}