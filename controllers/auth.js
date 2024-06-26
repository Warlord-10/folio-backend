const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require("../jwt");
const UserModel = require("../models/user");

const accessCookieSetting = {
    domain: "deepanshu.malaysingh.com",
    maxAge: 60*60*1000,
    secure: true,
    sameSite: "none",
    httpOnly: true,
}
const refreshCookieSetting = {
    domain: "deepanshu.malaysingh.com",
    maxAge: 60*60*24*1000,
    secure: true,
    sameSite: "none",
    httpOnly: true,
}


async function registerUser(req, res){
    try {
        console.log("registerUser");
        const user = await UserModel.create(req.body);
        
        // Generating JWT tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("accessToken", accessToken, accessCookieSetting)
        res.cookie("refreshToken", refreshToken, refreshCookieSetting)

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json('User creation failed');
    }
}

async function loginUser(req, res){
    try {
        console.log("loginUser");
        const user = await UserModel.findOne(
            {email: req.body.email}
        );
        const result = await bcrypt.compare(req.body.password, user.password)
        if(result===true){
            
            // Generating JWT tokens
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            
            res.cookie("accessToken", accessToken, accessCookieSetting)
            res.cookie("refreshToken", refreshToken, refreshCookieSetting)
            
            return res.status(200).json(user);
        }
        else{
            return res.status(500).json('Incorrect Password');
        }
    } catch (error) {
        return res.status(404).json('User Not Found');
    }
}

module.exports = {
    registerUser,
    loginUser
}