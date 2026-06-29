const { verifyAccessToken } = require("../utils/jwt");
const { AppError } = require("../utils/appError");


function resolveUser(req) {
    const token = req.cookies?.accessToken;
    if (!token) return null;
    try {
        return verifyAccessToken(token).user;   // Real User
    } catch {
        return null;    // Guest user
    }
}

function softAuth(req, res, next) {
    req.user = resolveUser(req);
    next();
}

function hardAuth(req, res, next) {
    const user = resolveUser(req);
    if (user) {
        req.user = user;
        return next();
    }

    if (req.cookies?.refreshToken) {
        throw new AppError(401, "Access token expired", "ACCESS_TOKEN_EXPIRED");
    }
    throw new AppError(401, "Unauthorized", "AUTH_REQUIRED");
}

module.exports = {
    resolveUser,
    softAuth,
    hardAuth,
};
