const UserModel = require("../models/user");
const {logError, logInfo} = require("../utils/logger.js");

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




// To view the details of a user
async function getUserById(req, res){
    logInfo("getUserById");
    try {
        const data = await UserModel.findById(req.params.uid, "-password");
        return res.status(200).json({
            data: data,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        });
        
    } catch (error) {
        logError(error)
        return res.status(500).json(error);
    }
}
async function delUserById(req, res){
    try {
        logInfo("delUserById");
        const data = await UserModel.findById(req.user.userId);
        if(req.user && req.user.userId == req.params.uid){

            await data.deleteOne();

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            return res.status(200).send(
                "Deleted"
            );
        }
        else{
            return res.status(500).send("Permission Denied");
        }
    } catch (error) {
        return res.status(500).json(error);
    }
}
async function updateUserById(req, res){
    try {
        logInfo("updateUserById");
        if(req.user && req.user.userId == req.params.uid){
            const data = await UserModel.findByIdAndUpdate(req.user.userId, req.body, {new: true}).select("-password");
            return res.status(200).json(
                data
            )
        }
        else{
            return res.status(500).json("Permission Denied");
        }
    } catch (error) {
        return res.status(404).json(error);
    }
}


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
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
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