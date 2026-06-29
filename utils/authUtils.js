const { accessCookieSetting, refreshCookieSetting, resetCookieSetting } = require("../middleware/cookieConfig");
const { generateAccessToken, generateRefreshToken } = require("./jwt");

// authUtils.js
function setAuthCookies(res, userData) {
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.cookie("accessToken", accessToken, accessCookieSetting);
    res.cookie("refreshToken", refreshToken, refreshCookieSetting);

    return { accessToken, refreshToken };
}

function clearAuthCookies(res) {
    res.cookie("accessToken", null, resetCookieSetting);
    res.cookie("refreshToken", null, resetCookieSetting);
}

module.exports = { setAuthCookies, clearAuthCookies };
