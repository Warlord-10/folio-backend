const bcrypt = require('bcrypt');
const UserModel = require("../models/user");
const { logError, logInfo } = require("../utils/logger.js");
const { setAuthCookies } = require("../utils/authUtils.js");
const { resetCookieSetting } = require('../middleware/cookieConfig.js');
const { verifyRefreshToken } = require('../utils/jwt.js');
const { AppError } = require('../utils/appError.js');
const { asyncHandler } = require("../utils/errorUtils.js");

const registerUser = asyncHandler(async (req, res) => {
    logInfo("registerUser");

    const { email, password, name } = req.body;

    // Validate request body
    if (!email || !password || !name) {
        throw new AppError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        throw new AppError(409, "Email already in use");
    }

    // Create new user
    const user = await UserModel.create({ email, name, password });

    // Generate JWT tokens & set auth cookies
    setAuthCookies(res, user.toJSON());

    return res.status(201).json({
        message: "User registered successfully",
        user: user
    });
});

const loginUser = asyncHandler(async (req, res) => {
    logInfo("loginUser");

    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required");
    }

    // Check if user exists
    const user = await UserModel.findOne({ email }, "+password");
    if (!user) {
        throw new AppError(404, "User not found");
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new AppError(401, "Incorrect password");
    }

    // Generate JWT tokens & set auth cookies
    setAuthCookies(res, user.toJSON());

    return res.status(200).json({
        message: "Login successful",
        user: user
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    logInfo("logoutUser");

    res.cookie("accessToken", null, resetCookieSetting);
    res.cookie("refreshToken", null, resetCookieSetting);

    return res.status(200).json({ message: "Logout successful" });
});

const getNewAccessToken = asyncHandler(async (req, res) => {
    logInfo("getNewAccessToken");

    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new AppError(401, "Refresh token not found", "REFRESH_TOKEN_EXPIRED");
    }

    // verifyRefreshToken throws on an invalid/expired token. We clear the stale
    // cookies before surfacing the error so the client isn't stuck with bad tokens.
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        throw new AppError(401, "Invalid refresh token", "REFRESH_TOKEN_EXPIRED");
    }

    // Generate new JWT tokens & set auth cookies
    setAuthCookies(res, decoded);

    return res.status(200).json({ message: "Token refreshed successfully" });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getNewAccessToken,
};
