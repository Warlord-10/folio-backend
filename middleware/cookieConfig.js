const accessCookieSetting = {
    domain: process.env.MODE === "prod" ? process.env.DOMAIN: null,
    maxAge: 60*60*1000,
    secure: process.env.MODE === "prod" ? true : false,
    sameSite: "strict",
    httpOnly: true,
}
const refreshCookieSetting = {
    domain: process.env.MODE === "prod" ? process.env.DOMAIN: null,
    maxAge: 60*60*24*1000,
    secure: process.env.MODE === "prod" ? true : false,
    sameSite: "strict",
    httpOnly: true,
}

module.exports = {
    accessCookieSetting,
    refreshCookieSetting
};