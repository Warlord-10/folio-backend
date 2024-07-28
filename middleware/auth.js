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
        const new_access_token = generateAccessToken(req.user.userId);
        res.cookie("accessToken", new_access_token, {
            domain: process.env.MODE !== "dev" ? "deepanshu.malaysingh.com": null,
            maxAge: 60*60*1000,
            secure: true,
            sameSite: "none",
            httpOnly: true,
        }); 
        next();
    }
}


module.exports = {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare}