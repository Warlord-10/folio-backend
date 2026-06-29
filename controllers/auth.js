const bcrypt = require('bcrypt');
const UserModel = require("../models/user");
const { logError, logInfo } = require("../utils/logger.js");
const { setAuthCookies, clearAuthCookies } = require("../utils/authUtils.js");
const { resetCookieSetting } = require('../middleware/cookieConfig.js');
const { verifyRefreshToken } = require('../utils/jwt.js');
const { AppError } = require('../utils/appError.js');
const { asyncHandler } = require("../utils/errorUtils.js");
const { getCache, setCache, delCache, cacheKeys } = require('../utils/cache.js');


const REFRESH_TOKEN_TTL = 24 * 60 * 60;

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

    // Issue tokens and record the refresh token server-side (the source of truth
    // for whether this session is still valid).
    const { refreshToken } = setAuthCookies(res, user.toJSON());
    await setCache(cacheKeys.userSession(user._id), refreshToken, REFRESH_TOKEN_TTL);

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

    // Issue tokens and record the refresh token server-side. A fresh login
    // replaces any existing session for this user (single active session).
    const { refreshToken } = setAuthCookies(res, user.toJSON());
    await setCache(cacheKeys.userSession(user._id), refreshToken, REFRESH_TOKEN_TTL);

    return res.status(200).json({
        message: "Login successful",
        user: user
    });
});


const logoutUser = asyncHandler(async (req, res) => {
    logInfo("logoutUser");

    // Logout has no auth middleware and the access token may already be expired,
    // so derive the user from the refresh cookie rather than req.user.
    const { refreshToken } = req.cookies;
    clearAuthCookies(res);

    if (refreshToken) {
        try {
            const user = verifyRefreshToken(refreshToken);
            await delCache(cacheKeys.userSession(user._id));
        } catch { }
    }

    return res.status(200).json({ message: "Logout successful" });
});


const getNewAccessToken = asyncHandler(async (req, res) => {
    logInfo("getNewAccessToken");

    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new AppError(401, "Refresh token not found", "REFRESH_TOKEN_EXPIRED");
    }

    let user;
    try {
        user = verifyRefreshToken(refreshToken);
    } catch {
        clearAuthCookies(res);
        throw new AppError(401, "Invalid refresh token", "REFRESH_TOKEN_EXPIRED");
    }

    const sessionKey = cacheKeys.userSession(user._id);
    const storedToken = await getCache(sessionKey);

    if (!storedToken || storedToken !== refreshToken) {
        await delCache(sessionKey);
        clearAuthCookies(res);
        throw new AppError(401, "Session expired or revoked", "REFRESH_TOKEN_EXPIRED");
    }

    const { refreshToken: newRefreshToken } = setAuthCookies(res, user);
    await setCache(sessionKey, newRefreshToken, REFRESH_TOKEN_TTL);

    return res.status(200).json({ message: "Token refreshed successfully" });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getNewAccessToken,
};
