const { verifyAccessToken } = require("../jwt");

function verifyTokenMiddleWare(req, res, next){
    // console.log("middle")
    // console.log(req.headers)
    try {
        const token = req.cookies.accessToken;
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next();
        // return res.status(405).json("Token Expired");
    }
}

function userAuthorizationMiddleware(req, res, next){
    try {
        const token = req.cookies.accessToken;
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        if(req.params.uid == decoded.userId){
            next();
        }
        else{
            return res.status(500).json("Permission Denied")
        }
    } catch (error) {
        return res.status(405).json("Token Expired");
    }
}
module.exports = {verifyTokenMiddleWare, userAuthorizationMiddleware}