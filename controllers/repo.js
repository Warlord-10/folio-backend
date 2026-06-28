const { FileModel, FolderModel } = require("../models/repo");
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { logError, logInfo } = require("../utils/logger.js");
const { cacheKeys, delCache } = require("../utils/cache.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");

// Invalidates the cached language breakdown for the project a file/folder belongs to.
// relPath is "<ownerId>/<projectTitle>/...".
async function invalidateProjectLanguagesByRelPath(relPath) {
    if (!relPath) return;
    const parts = relPath.split(path.sep);
    if (parts.length < 2) return;
    const [ownerId, projectTitle] = parts;
    await delCache(cacheKeys.projectLanguages(ownerId, projectTitle));
}


// gets all the files of a folder by Id
const getFolder = asyncHandler(async (req, res) => {
    logInfo("getFolder");

    const data = await FolderModel.findById(req.params.fid).lean();
    if (!data) {
        throw new AppError(404, "No Folder Found");
    }

    // Independent queries — run them concurrently.
    const [folder, files] = await Promise.all([
        FolderModel.find({ parent_id: req.params.fid }).lean(),
        FileModel.find({ parent_id: req.params.fid }).lean(),
    ]);

    return res.status(200).json({
        data: data,
        folders: folder,
        files: files
    });
});

// creates a new folder
const makeFolder = asyncHandler(async (req, res) => {
    logInfo("makeFolder");

    const { folder_name, parent_id } = req.body;
    if (!folder_name || !parent_id) {
        throw new AppError(400, "Folder name or parent id is missing");
    }

    const folder = await FolderModel.create({
        name: folder_name,
        parent_id: parent_id
    });

    if (!folder) {
        throw new AppError(400, "Folder not created");
    }

    return res.status(201).json(folder);
});

// updates a folder
const updateFolder = asyncHandler(async (req, res) => {
    logInfo("updateFolder");

    if (!req.body) {
        throw new AppError(400, "Fields are missing");
    }

    const folder = await FolderModel.findByIdAndUpdate(req.params.fid, req.body, { new: true });

    if (!folder) {
        throw new AppError(404, "Folder not updated");
    }

    return res.status(200).json(folder);
});

// removes a folder
const removeFolder = asyncHandler(async (req, res) => {
    logInfo("removeFolder");
    const folder = await FolderModel.findById(req.params.fid);

    if (!folder) {
        throw new AppError(404, "Folder not found");
    }

    const ans = await folder.deleteOne();
    return res.status(200).json(ans);
});


// reads the file by Id and sends its content
const getFileData = asyncHandler(async (req, res) => {
    logInfo("getFileData");

    const file = await FileModel.findById(req.params.fid);
    if (!file) {
        throw new AppError(404, "File not found");
    }

    const filePath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, file.relPath);
    return res.sendFile(filePath);
});

// sends the file information stored in the database
const getFileDetail = asyncHandler(async (req, res) => {
    logInfo("getFileDetail");
    const file = await FileModel.findById(req.params.fid);

    if (!file) {
        throw new AppError(404, "File not found");
    }

    return res.status(200).json(file);
});

// creates a file
const makeFile = asyncHandler(async (req, res) => {
    logInfo("makeFile");
    const { file_name, parent_id } = req.body;

    if (!file_name || !parent_id) {
        throw new AppError(400, "File name or parent id is missing");
    }

    const fileObj = await FileModel.create({
        name: file_name,
        parent_id: parent_id,
        extension: path.extname(file_name).replace('.', '')
    });

    await invalidateProjectLanguagesByRelPath(fileObj.relPath);

    return res.status(201).json(fileObj);
});

// updates the file
const updateFile = asyncHandler(async (req, res) => {
    logInfo("updateFile");

    // Validate request parameters
    if (!req.params.fid) {
        throw new AppError(400, "File ID is required");
    }

    // Find the file first to ensure it exists
    const file = await FileModel.findById(req.params.fid);
    if (!file) {
        throw new AppError(404, "File not found");
    }

    // Update file metadata if fields are provided
    if (req.body.fields) {
        const updatedFile = await FileModel.findByIdAndUpdate(
            req.params.fid,
            req.body.fields,
            { new: true }
        );
        if (!updatedFile) {
            throw new AppError(400, "Failed to update file metadata");
        }
    }

    // Update file content if data is provided
    if (req.body.content) {
        const filePath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, file.relPath);

        // Use the promise API so we actually wait for the write to finish and
        // don't risk sending two responses on error.
        await fsp.writeFile(filePath, req.body.content);

        // Content changed -> the project's language breakdown may be stale.
        await invalidateProjectLanguagesByRelPath(file.relPath);

        return res.status(200).json({
            message: "File updated successfully",
            fileId: req.params.fid
        });
    }

    return res.status(200).json({
        message: "No changes were present",
        fileId: req.params.fid
    });
});

// deletes a file
const removeFile = asyncHandler(async (req, res) => {
    logInfo("removeFile");
    const file = await FileModel.findById(req.params.fid);

    if (!file) {
        throw new AppError(404, "File not found");
    }

    const ans = await file.deleteOne();
    await invalidateProjectLanguagesByRelPath(file.relPath);
    return res.status(200).json(ans);
});

// for uploading a file
const uploadFile = asyncHandler(async (req, res) => {
    logInfo("uploadFile");
    return res.status(201).json({
        Message: "Uploaded Successfully"
    });
});


module.exports = {
    makeFile,
    getFileData,
    getFileDetail,
    updateFile,
    removeFile,
    uploadFile,

    makeFolder,
    getFolder,
    removeFolder,
    updateFolder,
};
