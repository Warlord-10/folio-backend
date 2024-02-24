const jwt = require("jsonwebtoken");
require('dotenv').config();

// Main functions
function generateRefreshToken(userId){
    try {
        return jwt.sign(
            {userId}, 
            process.env.REFRESH_TOKEN,
            {expiresIn: "1d"}
        );
    } catch (error) {
        return null
    }
}
function verifyRefreshToken(tok){
    try{
        return jwt.verify(tok, process.env.REFRESH_TOKEN);
    }catch (err) {
        return null;
    }
}

function generateAccessToken(userId){
    try {
        return jwt.sign(
            {userId}, 
            process.env.ACCESS_TOKEN,
            {expiresIn: "1h"}
        );
    } catch (error) {
        return null
    }
}
function verifyAccessToken(tok){
    try{
        return jwt.verify(tok, process.env.ACCESS_TOKEN);
    }catch (err) {
        return null;
    }
}

module.exports = {
    generateRefreshToken, 
    verifyRefreshToken, 
    generateAccessToken, 
    verifyAccessToken
};