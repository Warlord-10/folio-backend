const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require("../jwt");
const UserModel = require("../models/user");


async function registerUser(req, res){
    try {
        console.log("registerUser");
        const user = await UserModel.create(req.body);
        
        // Generating JWT tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        return res.status(200).json({
            user, accessToken, refreshToken
        });
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
            
            
            return res.status(200).json({
                user, accessToken, refreshToken
            });
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