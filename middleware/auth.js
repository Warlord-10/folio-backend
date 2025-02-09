const { setAuthCookies } = require("../utils/authUtils");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwt");

function verifyRefreshTokenMiddleWare(req, res, next){
    try {
        const refresh_token = req.cookies.refreshToken;
        const decoded_refresh_token = verifyRefreshToken(refresh_token);

        req.user = decoded_refresh_token;
        next();
    } catch (error) {
        return res.status(401).json("Token Expired");
    }
}

function verifyAccessTokenMiddleWare(req, res, next){
    try {
        const access_token = req.cookies.accessToken;
        const decoded_access_token = verifyAccessToken(access_token);

        req.user = decoded_access_token;
        next();

    } catch (error) {
        // Refresh Token Exists
        if(req.cookies.refreshToken !== null && req.cookies.refreshToken !== undefined){
            const decoded_refresh_token = verifyRefreshToken(req.cookies.refreshToken);

            setAuthCookies(res, decoded_refresh_token.userId);

            req.user = decoded_refresh_token;
        } 
        // No Refresh Token
        else{
            req.user = {userId: null};
        }

        next();
    }
}


module.exports = {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare}