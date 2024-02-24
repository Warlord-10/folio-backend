const { verifyAccessToken } = require("../jwt");

function verifyTokenMiddleWare(req, res, next){
    // console.log("middle")
    // console.log(req.cookies)
    try {
        const token = req.cookies.accessToken;
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(405).json({ "error": error });
    }
}

function userAuthorizationMiddleware(req, res, next){
    
}

module.exports = verifyTokenMiddleWare