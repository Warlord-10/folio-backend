const ProjectModel = require("../models/project");
const UserModel = require("../models/user");
const path = require("path")

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
        let data;
        if(req.user){
            data = await UserModel.findById(req.user.userId, "-password").populate("projects");
        }
        else{
            data = await UserModel.findById(req.params.uid, "-password").populate("projects");
        }
        return res.status(200).json(data);
    } catch (error) {
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
        return res.status(500).json({ error: error });
    }
}
async function updateUserById(req, res){
    try {
        console.log("updateUserById");
        req.body.avatar = `http://127.0.0.1:3005/public/${req.user.userId}/${req.file.filename}`
        const data = await UserModel.findByIdAndUpdate(req.user.userId, req.body, {new: true});
        return res.status(200).json(
            data
        )
    } catch (error) {
        return res.status(404).json({error: "Error "});
    }
}

async function getUserProfilePage(req, res){
    try {
        console.log("getUserProfilePage");
        const data = await UserModel.findById(req.params.uid);
        if(data.userPageProject === undefined || data.userPageProject === null){
            return res.status(404).json({error: "No Folio Set"});
        }
        const inputDir = path.join('test',`${data._id}`,'bundle.js')
        return res.status(200).json({
            link: inputDir
        })
    } catch (error) {
        return res.status(404).json({error: error});
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