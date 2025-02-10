const accessCookieSetting = {
    domain: process.env.MODE === "prod" ? process.env.DOMAIN: null,
    secure: process.env.MODE === "prod",
    sameSite: process.env.MODE === "prod" ? "none": "lax",
    maxAge: 60*60*1000,    // 1 hour
    httpOnly: true,
}
const refreshCookieSetting = {
    domain: process.env.MODE === "prod" ? process.env.DOMAIN: null,
    secure: process.env.MODE === "prod",
    sameSite: process.env.MODE === "prod" ? "none": "lax",
    maxAge: 7*60*60*24*1000,    // 7 days
    httpOnly: true,
}


const resetCookieSetting = {
    domain: process.env.MODE === "prod" ? process.env.DOMAIN: null,
    secure: process.env.MODE === "prod",
    sameSite: process.env.MODE === "prod" ? "none": "lax",
    maxAge: 0,
    httpOnly: true,
}

module.exports = {
    accessCookieSetting,
    refreshCookieSetting,
    resetCookieSetting
};