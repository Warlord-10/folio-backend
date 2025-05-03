const { FileModel, FolderModel } = require("../models/repo");
const fs = require('fs');
const path = require('path');
const { logError, logInfo } = require("../utils/logger.js");


// gets all the files of a folder by Id
async function getFolder(req, res) {
    try {
        logInfo("getFolder");
        const data = await FolderModel.findById(req.params.fid);

        if (!data) {
            return res.status(404).json('No Folder Found');
        }

        const folder = await FolderModel.find({
            parent_id: req.params.fid
        })
        const files = await FileModel.find({
            parent_id: req.params.fid
        })

        if (!folder || !files) {
            return res.status(404).json('No Folder Found');
        }

        return res.status(200).json({
            data: data,
            folders: folder,
            files: files
        });
    } catch (error) {
        return res.status(500).json("Error occurred");
    }
}

// creates a new folder
async function makeFolder(req, res) {
    try {
        logInfo("makeFolder");

        const { folder_name, parent_id } = req.body;
        if (!folder_name || !parent_id) {
            return res.status(400).json("Folder name or parent id is missing");
        }

        const folder = await FolderModel.create({
            name: folder_name,
            parent_id: parent_id
        });

        if (!folder) {
            return res.status(400).json("Folder not created");
        }

        return res.status(201).json(folder);
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occured in creating the folder");
    }
}

// updates a folder
async function updateFolder(req, res) {
    try {
        logInfo("updateFolder");

        if (!req.body) {
            return res.status(400).json("Fields are missing");
        }

        const folder = await FolderModel.findByIdAndUpdate(req.params.fid, req.body, { new: true });

        if (!folder) {
            return res.status(404).json('Folder not updated');
        }

        return res.status(200).json(folder);
    } catch (error) {
        return res.status(500).json("Error occured in updating the folder");
    }
}

// removes a folder
async function removeFolder(req, res) {
    try {
        logInfo("removeFolder");
        const folder = await FolderModel.findById(req.params.fid);

        if (!folder) {
            return res.status(404).json('Folder not found');
        }

        const ans = await folder.deleteOne();
        return res.status(200).json(ans);
    } catch (error) {
        return res.status(500).json("Error occured in deleting the folder");
    }
}


// reads the file by Id and sends its content
async function getFileData(req, res) {
    try {
        logInfo("getFileData");
        const file = await FileModel.findById(req.params.fid);

        if (!file) {
            return res.status(404).json('File not found');
        }

        const filePath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, file.relPath)
        return res.sendFile(filePath);
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occured in reading the file");
    }
}

// sends the file information stored in the database
async function getFileDetail(req, res) {
    try {
        logInfo("getFileDetail");
        const file = await FileModel.findById(req.params.fid);

        if (!file) {
            return res.status(404).json('File not found');
        }

        return res.status(200).json(file);
    } catch (error) {
        return res.status(500).json("Error occured in reading the file details")
    }
}

// creates a file
async function makeFile(req, res) {
    try {
        logInfo("makeFile");
        const { file_name, parent_id } = req.body;

        if (!file_name || !parent_id) {
            return res.status(400).json("File name or parent id is missing");
        }

        const fileObj = await FileModel.create({
            name: file_name,
            parent_id: parent_id,
            extension: path.extname(file_name).replace('.', '')
        });

        return res.status(201).json(fileObj);
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occured in creating the file");
    }
}

// updates the file
async function updateFile(req, res) {
    try {
        logInfo("updateFile");

        // Validate request parameters
        if (!req.params.fid) {
            return res.status(400).json("File ID is required");
        }

        // Find the file first to ensure it exists
        const file = await FileModel.findById(req.params.fid);
        if (!file) {
            return res.status(404).json('File not found');
        }

        // Update file metadata if fields are provided
        if (req.body.fields) {
            const updatedFile = await FileModel.findByIdAndUpdate(
                req.params.fid,
                req.body.fields,
                { new: true }
            );
            if (!updatedFile) {
                return res.status(400).json("Failed to update file metadata");
            }
        }

        // Update file content if data is provided
        if (req.body.data) {
            const filePath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, file.relPath);

            await fs.writeFile(filePath, req.body.data, (err) => {
                if (err) {
                    return res.status(500).json("Failed to update file content");
                }
            })

            return res.status(200).json({
                message: "File updated successfully",
                fileId: req.params.fid
            });
        }

    } catch (error) {
        logError(error);
        return res.status(500).json("Error occurred in updating the file");
    }
}

// deletes a file
async function removeFile(req, res) {
    try {
        logInfo("removeFile");
        const file = await FileModel.findById(req.params.fid);

        if (!file) {
            return res.status(404).json('File not found');
        }

        const ans = await file.deleteOne();
        return res.status(200).json(ans);
    } catch (error) {
        return res.status(500).json("Error occured in deleting the file");
    }
}

// for uploading a file
async function uploadFile(req, res) {
    try {
        logInfo("uploadFile")
        return res.status(201).json({
            Message: "Uploaded Successfully"
        });
    } catch (error) {
        return res.status(500).json({ error: error });
    }
}


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