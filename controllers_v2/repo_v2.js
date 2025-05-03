const { FileModel, FolderModel } = require("../models/repo.js");
const path = require('path');
const fs = require('fs');
const {logError, logInfo} = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");


// Reads a file
async function getFile_v2(req, res){
    try {
        logInfo("getFile_v2")
        const full_path_of_file = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, req.params.repo_path)
        return res.sendFile(full_path_of_file);
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occurred in reading the file details")
    }
}

// Gets metadata of a file
async function getFileDetails_v2(req, res){
    try {
        logInfo("getFileDetails_v2")
        const repoPath = req.params.repo_path ?? '';

        const data = await FileModel.findOne({relPath: path.join(req.params.uid, req.params.pname, repoPath)})

        if(!data) return res.status(404).json("File not found")

        if(data.language == "C++") data.language = "cpp";

        return res.status(200).json({
            data: data,
            permission: generatePermission(req.user._id, req.params.uid)
        })
    } catch (error) {
        logError(error)
        return res.status(500).json("Error in getting file details")
    }
}

// Gets data of a folder
async function getFolder_v2(req, res){
    try {
        logInfo("getFolder_v2")
        const repoPath = req.params.repo_path ?? '';

        const currFolder = await FolderModel.findOne({relPath: path.join(req.params.uid, req.params.pname, repoPath)})

        if(!currFolder) return res.status(404).json("Folder not found")

        const files = await FileModel.find({parent_id: currFolder._id})
        const folders = await FolderModel.find({parent_id: currFolder._id})

        if(!files || !folders) return res.status(404).json("No files or folders found")

        return res.status(200).json({
            data: currFolder,
            folders: folders,
            files: files,
            permission: generatePermission(req.user._id, req.params.uid)
        })
    } catch (error) {
        logError(error)
        return res.status(500).json("Error in getting folder details")
    }
}

module.exports = {
    getFile_v2,
    getFolder_v2,
    getFileDetails_v2
}