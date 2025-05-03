const accessCookieSetting = {
    secure: true,
    sameSite: "Strict",
    maxAge: 60*60*1000,    // 1 hour
    httpOnly: true,
    path: "/"
}
const refreshCookieSetting = {
    secure: true,
    sameSite: "Strict",
    maxAge: 7*60*60*24*1000,    // 7 days
    httpOnly: true,
    path: "/"
}


const resetCookieSetting = {
    secure: true,
    sameSite: "Strict",
    maxAge: 0,
    httpOnly: true,    
    path: "/"
}

module.exports = {
    accessCookieSetting,
    refreshCookieSetting,
    resetCookieSetting
};