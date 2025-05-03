const { accessCookieSetting, refreshCookieSetting } = require("../middleware/cookieConfig");
const { generateAccessToken, generateRefreshToken } = require("./jwt");

// authUtils.js
function setAuthCookies(res, userData) {
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);
    
    res.cookie("accessToken", accessToken, accessCookieSetting);
    res.cookie("refreshToken", refreshToken, refreshCookieSetting);
}

module.exports = { setAuthCookies };
