const { setAuthCookies } = require("../utils/authUtils");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwt");

// Verifies the refresh token
// function verifyRefreshTokenMiddleWare(req, res, next) {
//     try {
//         if (!req.cookies || !req.cookies.refreshToken) {
//             throw new Error("No Refresh Token Provided");
//         }

//         const refresh_token = req.cookies.refreshToken;
//         const decoded_refresh_token = verifyRefreshToken(refresh_token);

//         if (!decoded_refresh_token.user) {
//             throw new Error("Invalid Refresh Token");
//         }

//         req.user = decoded_refresh_token.user;
//         return next();
//     } catch (error) {
//         req.user = { user: null };
//         return next();
//     }
// }


// Verifies the access token
// async function verifyAccessTokenMiddleWare(req, res, next) {
//     try {
//         if (!req.cookies || !req.cookies.accessToken) {
//             throw new Error("No Access Token Present");
//         }

//         const access_token = req.cookies.accessToken;
//         const decoded_access_token = verifyAccessToken(access_token);

//         if (!decoded_access_token.user) {
//             throw new Error("Invalid Access Token");
//         }

//         req.user = decoded_access_token.user;
//         return next();
//     } catch (error) {
//         req.user = { user: null };
//         return next();
//     }
// }

async function SoftAuthenticationMiddleWare(req, res, next) {
    try {
        if (!req.cookies || !req.cookies.accessToken) {
            req.user = { user: null };
            return next();
        }

        const access_token = req.cookies.accessToken;
        const decoded_access_token = verifyAccessToken(access_token);

        if (!decoded_access_token.user) {
            throw new Error("Invalid Access Token");
        }

        req.user = decoded_access_token.user;
        return next();
    } catch (error) {
        req.user = { user: null };
        return next();
    }
}

async function HardAuthenticationMiddleWare(req, res, next) {
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
        return res.status(401).json({ message: "Unauthorized" });
    }
}


module.exports = {
    // verifyRefreshTokenMiddleWare, 
    // verifyAccessTokenMiddleWare, 
    SoftAuthenticationMiddleWare,
    HardAuthenticationMiddleWare
}