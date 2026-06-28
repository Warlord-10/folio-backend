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
            return res.status(401).json({ message: "Refresh Required", code: "ACCESS_TOKEN_EXPIRED" });
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
        // CHECK: Do we have a refresh token?
        if (refreshToken) {
            return res.status(401).json({ message: "Refresh Required", code: "ACCESS_TOKEN_EXPIRED" });
        }

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
        // Check if we have a refresh token to distinguish between "expired access" and "no auth"
        if (req.cookies && req.cookies.refreshToken) {
            return res.status(401).json({ message: "Access Token Expired", code: "ACCESS_TOKEN_EXPIRED" });
        }
        return res.status(401).json({ message: "Unauthorized", code: "AUTH_REQUIRED" });
    }
}


module.exports = {
    SoftAuthenticationMiddleWare,
    HardAuthenticationMiddleWare
}