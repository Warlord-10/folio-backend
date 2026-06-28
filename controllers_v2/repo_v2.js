const { FileModel, FolderModel } = require("../models/repo.js");
const path = require('path');
const fs = require('fs');
const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");


// Reads a file
const getFile_v2 = asyncHandler(async (req, res) => {
    logInfo("getFile_v2");
    const full_path_of_file = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, req.params.repo_path);

    return res.sendFile(full_path_of_file);
});


// Gets metadata of a file
const getFileDetails_v2 = asyncHandler(async (req, res) => {
    logInfo("getFileDetails_v2");
    const repoPath = req.params.repo_path ?? '';

    const full_path_of_file = path.join(req.params.uid, req.params.pname, repoPath);
    const data = await FileModel.findOne({ relPath: full_path_of_file }).lean();

    if (!data) throw new AppError(404, "File not found");

    if (data.language == "C++") data.language = "cpp";

    return res.status(200).json({
        data: data,
        permission: generatePermission(req.user?._id || null, req.params.uid)
    });
});


// Gets data of a folder
const getFolder_v2 = asyncHandler(async (req, res) => {
    logInfo("getFolder_v2");
    const repoPath = req.params.repo_path ?? '';

    const pathToSearch = path.join(req.params.uid, req.params.pname, repoPath);
    const currFolder = await FolderModel.findOne({ relPath: pathToSearch }).lean();

    if (!currFolder) throw new AppError(404, "Folder not found");

    // Independent queries — run them concurrently.
    const [files, folders] = await Promise.all([
        FileModel.find({ parent_id: currFolder._id }).lean(),
        FolderModel.find({ parent_id: currFolder._id }).lean(),
    ]);

    return res.status(200).json({
        data: currFolder,
        folders: folders,
        files: files,
        permission: generatePermission(req.user?._id || null, req.params.uid)
    });
});

module.exports = {
    getFile_v2,
    getFolder_v2,
    getFileDetails_v2
}
