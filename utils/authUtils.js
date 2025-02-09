const { accessCookieSetting, refreshCookieSetting } = require("../middleware/cookieConfig");
const { generateAccessToken, generateRefreshToken } = require("./jwt");

// authUtils.js
function setAuthCookies(res, userId) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    
    res.cookie("accessToken", accessToken, accessCookieSetting);
    res.cookie("refreshToken", refreshToken, refreshCookieSetting);
}

module.exports = { setAuthCookies };
