const { setAuthCookies } = require("../utils/authUtils");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwt");

// If the access token is not present then it will provide guest access
// The req.user can be null or the user itself
function SoftAuthenticationMiddleWare(req, res, next) {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // 1. If NO Access Token is present
    if (!accessToken) {
        // CHECK: Is this a Guest or an Expired User?
        if (refreshToken) {
            // It's a User with a dead access token. Force Refresh.
            return res.status(401).json({ message: "Refresh Required" });
        }

        // It's a True Guest. Allow entry.
        req.user = null;
        return next();
    }

    // 2. Access Token IS present
    try {
        const decoded = verifyAccessToken(accessToken);
        req.user = decoded.user;
        return next();
    } catch (error) {
        // Access token is present but invalid/expired.

        // CHECK: Do we have a refresh token?
        if (refreshToken) {
            // Force refresh so they stay logged in
            return res.status(401).json({ message: "Refresh Required" });
        }

        // Weird edge case: Invalid access token and NO refresh token.
        // Treat as Guest.
        req.user = null;
        return next();
    }
}


// If the access token is not present then it will require re-authentication
// The req.user has to be the user itself
function HardAuthenticationMiddleWare(req, res, next) {
    try {
        if (!req.cookies || !req.cookies.accessToken) {
            throw new Error("No Access Token Present");
        }

        const access_token = req.cookies.accessToken;
        const decoded_access_token = verifyAccessToken(access_token);

        if (!decoded_access_token.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = decoded_access_token.user;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}


module.exports = {
    SoftAuthenticationMiddleWare,
    HardAuthenticationMiddleWare
}