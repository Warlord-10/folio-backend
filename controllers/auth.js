const bcrypt = require('bcrypt');
const UserModel = require("../models/user");
const { logError, logInfo } = require("../utils/logger.js");
const { setAuthCookies } = require("../utils/authUtils.js");
const { resetCookieSetting } = require('../middleware/cookieConfig.js');

async function registerUser(req, res) {
    try {
        logInfo("registerUser");

        const { email, password, name } = req.body;

        // Validate request body
        if (!email || !password || !name) {
            return res.status(400).json({error: "All fields are required"});
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({error: "Email already in use"});
        }

        // Create new user
        const user = await UserModel.create({ email, name, password });

        // Generate JWT tokens & set auth cookies
        setAuthCookies(res, user.toJSON());

        return res.status(201).json({
            message: "User registered successfully",
            user_id: user._id
        });
    } catch (error) {
        logError(error);
        return res.status(500).json({error: "User creation failed"});
    }
}

async function loginUser(req, res) {
    try {
        logInfo("loginUser");

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({error: "Email and password are required"});
        }

        // Check if user exists
        const user = await UserModel.findOne({ email }, "+password");
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({error: "Incorrect password"});
        }

        // Generate JWT tokens & set auth cookies
        setAuthCookies(res, user.toJSON());

        return res.status(200).json({
            message: "Login successful",
            user_id: user._id
        });
    } catch (error) {
        logError(error);
        return res.status(500).json({error: "Login failed"});
    }
}

async function getSession(req, res) {
    try {
        logInfo("getSession");

        if (req.session?.user) {
            return res.status(200).json({ user: req.session.user });
        } else {
            return res.status(401).send("No active session");
        }
    } catch (error) {
        logError(error);
        return res.status(500).send("Error fetching session");
    }
}

async function logoutUser(req, res) {
    try {
        logInfo("logoutUser");

        res.cookie("accessToken", null, resetCookieSetting);
        res.cookie("refreshToken", null, resetCookieSetting);

        return res.status(200).json({message: "Logout successful"});
    } catch (error) {
        logError(error);
        return res.status(500).json({error: "Logout error"});
    }
}

module.exports = {
    registerUser,
    loginUser,
    getSession,
    logoutUser,
};
