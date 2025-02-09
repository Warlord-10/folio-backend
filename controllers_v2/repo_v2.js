const { FileModel, FolderModel } = require("../models/repo.js");
const path = require('path');
const fs = require('fs');
const {logError, logInfo} = require("../utils/logger.js");


async function getFile_v2(req, res){
    try {
        logInfo("getFile_v2")
        const full_path_of_file = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, req.params.repo_path)
        return res.sendFile(full_path_of_file);

    } catch (error) {
        logError(error)
        return res.status(404).json({
            msg: "file not found"
        })
    }
}
async function getFileDetails_v2(req, res){
    try {
        logInfo("getFileDetails_v2")

        const data = await FileModel.findOne({relPath: path.join(req.params.uid, req.params.pname, req.params.repo_path)})
        if(data.language == "C++") data.language = "cpp";

        return res.status(200).json({
            data: data,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        })
    } catch (error) {
        logError(error)
        return res.status(404).json(error)
    }
}

async function getFolder_v2(req, res){
    try {
        logInfo("getFolder_v2")

        const currFolder = await FolderModel.findOne({relPath: path.join(req.params.uid, req.params.pname, req.params.repo_path)})
        const files = await FileModel.find({parent_id: currFolder._id})
        const folders = await FolderModel.find({parent_id: currFolder._id})
        // logger(currFolder, files, folders)
        
        return res.status(200).json({
            data: currFolder,
            folders: folders,
            files: files,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        })
    } catch (error) {
        logError(error)
        return res.status(404).json(error)
    }
}

module.exports = {
    getFile_v2,
    getFolder_v2,
    getFileDetails_v2
}