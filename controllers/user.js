const UserModel = require("../models/user");
const path = require("path");

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
        const data = await UserModel.findById(req.params.uid, "-password");
        return res.status(200).json({
            data: data,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);
    }
}
async function delUserById(req, res){
    try {
        console.log("delUserById");
        const data = await UserModel.findById(req.user.userId);
        if(req.user && req.user.userId == req.params.uid){
            await data.deleteOne();
            return res.status(200).json(
                data
            );
        }
        else{
            return res.status(500).json("Permission Denied");
        }
    } catch (error) {
        return res.status(500).json(error);
    }
}
async function updateUserById(req, res){
    try {
        console.log("updateUserById");
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
        console.log("getUserProfilePage");
        const data = await UserModel.findById(req.params.uid);
        if(data.user_portfolio === "undefined" || data.user_portfolio === "null"){
            return res.status(404).json("No Folio Set");
        }

        const inputDir = `${data._id}/bundle.js`
        console.log(inputDir);

        return res.status(200).json(inputDir)
    } catch (error) {
        return res.status(404).json("Error Occured");
    }
}

async function findUser(req, res){
    try {
        console.log("findUser");
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