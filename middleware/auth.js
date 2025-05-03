const { setAuthCookies } = require("../utils/authUtils");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwt");

function verifyRefreshTokenMiddleWare(req, res, next){
    try {
        if (!req.cookies || !req.cookies.refreshToken) {
            throw new Error("No Refresh Token Provided");
        }

        const refresh_token = req.cookies.refreshToken;
        const decoded_refresh_token = verifyRefreshToken(refresh_token);

        if(!decoded_refresh_token.user){
            throw new Error("Invalid Refresh Token");
        }

        req.user = decoded_refresh_token.user;
        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
        return;
    }
}

async function verifyAccessTokenMiddleWare(req, res, next) {
    try {
        if (!req.cookies || !req.cookies.accessToken) {
            throw new Error("No Access Token Present");
        }

        const access_token = req.cookies.accessToken;
        const decoded_access_token = verifyAccessToken(access_token);

        if (!decoded_access_token.user) {
            throw new Error("Invalid Access Token");
        }

        req.user = decoded_access_token.user;
        return next();
    } catch (error) {
        try {
            // Refresh Token Exists
            if (req.cookies && req.cookies.refreshToken) {
                const decoded_refresh_token = verifyRefreshToken(req.cookies.refreshToken);
                
                if (!decoded_refresh_token.user) {
                    throw new Error("Invalid Refresh Token");
                }

                setAuthCookies(res, decoded_refresh_token.user);
                req.user = decoded_refresh_token.user;
            } 
            // No Refresh Token
            else {
                req.user = { user: null };
            }

            return next();
        } catch (refreshError) {
            // If refresh token is also invalid, clear user
            req.user = { user: null };
            return next();
        }
    }
}


module.exports = {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare}