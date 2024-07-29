const { verifyAccessToken, verifyRefreshToken, generateAccessToken } = require("../jwt");

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
            const new_access_token = generateAccessToken(decoded_refresh_token.userId);

            // Setting Cookies
            res.cookie("accessToken", new_access_token, {
                domain: process.env.MODE !== "dev" ? "deepanshu.malaysingh.com": null,
                maxAge: 60*60*1000,
                secure: true,
                sameSite: "none",
                httpOnly: true,
            }); 

            req.user = new_access_token;
        } 
        // No Refresh Token
        else{
            req.user = null;
        }

        next();
    }
}


module.exports = {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare}