const UserModel = require("../models/user");

// For admin task only
async function getAllUser(req, res){
    try {
        console.log("getAllUser");
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
    console.log("getUserById");
    try {
        const data = await UserModel.findById(req.params.uid, "-password").populate("projects");
        if(req.user){
            console.log(req.user, req.params.uid);
        }
        if(req.user && req.user.userId === req.params.uid){
            return res.status(200).json({data, PERMISSION:"OWNER"});
        }
        return res.status(200).json({data, PERMISSION:"VISITOR"});
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);
    }
}
// Needs authorization
async function delUserById(req, res){
    try {
        console.log("delUserById");
        const data = await UserModel.findById(req.user.userId);
        await data.deleteOne();
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json(error);
    }
}
async function updateUserById(req, res){
    try {
        console.log("updateUserById");
        const data = await UserModel.findByIdAndUpdate(req.user.userId, req.body, {new: true}).populate("projects");
        return res.status(200).json(
            data
        )
    } catch (error) {
        return res.status(404).json(error);
    }
}

async function getUserProfilePage(req, res){
    try {
        console.log("getUserProfilePage");
        const data = await UserModel.findById(req.params.uid);
        if(data.userPageProject === "undefined" || data.userPageProject === "null"){
            return res.status(404).json("No Folio Set");
        }
        const inputDir = `${data._id}/bundle.js`
        return res.status(200).json(inputDir)
    } catch (error) {
        return res.status(404).json("Error Occured");
    }
}

module.exports = {
    getAllUser,
    delAllUser,

    getUserById,
    delUserById,
    updateUserById,
    getUserProfilePage,
}