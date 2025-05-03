const jwt = require("jsonwebtoken");
require('dotenv').config();

// Main functions
function generateRefreshToken(data){
    try {
        return jwt.sign(
            {user: data}, 
            process.env.REFRESH_TOKEN,
            {expiresIn: "1d"}
        );
    } catch (error) {
        throw new Error("Error occured in generating refresh token")
    }
}
function verifyRefreshToken(tok){
    try{
        return jwt.verify(tok, process.env.REFRESH_TOKEN);
    }catch (err) {
        throw err;
    }
}


function generateAccessToken(data){
    try {
        return jwt.sign(
            {user: data}, 
            process.env.ACCESS_TOKEN,
            {expiresIn: "1h"}
        );
    } catch (error) {
        throw new Error("Error occured in generating access token")
    }
}
function verifyAccessToken(tok){
    try{
        return jwt.verify(tok, process.env.ACCESS_TOKEN);
    }catch (err) {
        throw err;
    }
}

module.exports = {
    generateRefreshToken, 
    verifyRefreshToken, 

    generateAccessToken, 
    verifyAccessToken
};