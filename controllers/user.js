const UserModel = require("../models/user");
const { setAuthCookies } = require("../utils/authUtils.js");
const {logError, logInfo} = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");

// For admin task only
async function getAllUser(req, res){
    try {
        logInfo("getAllUser");
        const data = await UserModel.find({}, "-password");
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}
async function delAllUser(req, res){
    try {
        const data = await UserModel.deleteMany({});
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}




// To view the details of a user by Id
async function getUserById(req, res){
    logInfo("getUserById");
    try {
        const data = await UserModel.findById(req.params.uid, "-password");

        if(!data){
            return res.status(404).json("User not found");
        }

        return res.status(200).json({
            data: data,
            permission: generatePermission(req.user._id, req.params.uid)
        });
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occured in reading the user details");
    }
}

// To delete a user by Id
async function delUserById(req, res){
    try {
        logInfo("delUserById");
        const data = await UserModel.findById(req.user._id);

        if(!data){
            return res.status(404).json("User not found");
        }

        if(generatePermission(req.user._id, req.params.uid) != "OWNER"){
            return res.status(401).json("Permission Denied");
        }

        await data.deleteOne();
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(200).send("User Deleted");
    } catch (error) {
        return res.status(500).json("Error occured in deleting the user");
    }
}

// To update a user by Id
async function updateUserById(req, res){
    try {
        logInfo("updateUserById");

        if(generatePermission(req.user._id, req.params.uid) != "OWNER"){
            return res.status(403).json("Permission Denied");
        }
        if(!req.body){
            return res.status(400).json("Body is missing");
        }

        const data = await UserModel.findByIdAndUpdate(req.user._id, req.body, {new: true}).select("-password");

        if(!data){
            return res.status(404).json("User not found");
        }

        // set new cookies
        setAuthCookies(res, data);
        return res.status(200).json(data)
    } catch (error) {
        return res.status(500).json("Error occured in updating the user");
    }
}

// Deprecated
async function getUserProfilePage(req, res){
    try {
        logInfo("getUserProfilePage");
        const data = await UserModel.findById(req.params.uid);
        if(data.user_portfolio === "undefined" || data.user_portfolio === "null"){
            return res.status(404).json("No Folio Set");
        }

        const inputDir = `${data._id}/bundle.js`

        return res.status(200).json(inputDir)
    } catch (error) {
        return res.status(404).json("Error Occured");
    }
}

// Search for a user
async function findUser(req, res){
    try {
        logInfo("findUser");
        const searchTerm = req.query.name;
        const regex = new RegExp(searchTerm, 'i');
        const data = await UserModel
            .find({name: { $regex: regex}})
            .limit(10)
            .select("name _id")
            .exec();

        if(!data){
            return res.status(404).json("No User Found");
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json("Error occured in searching the users");
    }
}

module.exports = {
    getAllUser,
    delAllUser,

    getUserById,
    delUserById,
    updateUserById,

    getUserProfilePage,
    findUser,
}