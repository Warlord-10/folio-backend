const { FileModel, FolderModel } = require("../models/repo");
const path = require('path');
const fs = require('fs');
const express = require("express");

async function getFolder(req, res){
    try {
        console.log("getFolder");
        const folder = await FolderModel.findById(req.params.fid).populate(["files", "folders"]);
        return res.status(200).json(
            folder
        );
    } catch (error) {
        return res.status(404).json({
            msg: "Folder Not Found"
        });
    }
}
async function makeFolder(req, res){
    try {
        console.log("makeFolder");
        const folder = await FolderModel.create({
            name: req.body.name,
            parent: req.body.parent
        });
        return res.status(201).json(
            folder
        );
    } catch (error) {
        return res.status(500).json({
            msg: "Folder not created"
        });
    }
}
async function updateFolder(req, res){
    try {
        console.log("updateFolder");
        const folder = await FolderModel.findByIdAndUpdate(req.params.fid, req.body, {new: true});
        return res.status(200).json(
            folder
        );
    } catch (error) {
        return res.status(500).json({error: error});
    }
}

async function removeFolder(req, res){
    try {
        console.log("removeFolder");
        const folder = await FolderModel.findById(req.params.fid);
        const ans = await folder.deleteOne();
        return res.status(200).json(
            ans
        );
    } catch (error) {
        return res.status(500).json({error: error});
    }
}


// reads the file and sends its content
async function getFileData(req, res){
    try {
        console.log("getFileData");
        const file = await FileModel.findById(req.params.fid);
        const filePath = file.location;
        return res.sendFile(filePath);
    } catch (error) {
        return res.status(404).json({
            msg: "file not found"
        })
    }
}
// sends the file information stored in the database
async function getFileDetail(req, res){
    try {
        console.log("getFileDetail");
        const file = await FileModel.findById(req.params.fid);
        return res.status(200).json(
            file
        );
    } catch (error) {
        return res.status(404).json({
            msg: "file not found"
        })
    }
}
async function makeFile(req, res){
    try {
        console.log("makeFile");
        const fileName = req.body.name;
        const fileObj = await FileModel.create({
            name: fileName,
            parent: req.body.parent,
        });
        fs.writeFile(fileObj.location, "", (err)=>{
            if(err){
                return res.status(500).json({
                    msg: "creation failed"
                });
            }
        });
        return res.status(201).json(
            fileObj
        );
    } catch (error) {
        return res.status(500).json({
            msg: "creation failed"
        });
    }
}
async function updateFile(req, res){
    try {
        console.log("updateFile")
        if(req.body.fields){
            await FileModel.findByIdAndUpdate(req.params.fid, req.body.fields);
        }
        if(req.body.data){
            const file = await FileModel.findById(req.params.fid);
            fs.writeFile(file.location, req.body.data, (err)=>{
                if(err){
                    return res.status(500).json({
                        msg: "creation failed"
                    });
                }
                else{
                    return res.status(200).json({
                        msg: "updated successfully"
                    });
                }
            })
        }
    } catch (error) {
        return res.status(500).json({error: error});
    }
}
async function removeFile(req, res){
    try {
        console.log("removeFile");
        const file = await FileModel.findById(req.params.fid);
        const ans = await file.deleteOne();
        return res.status(200).json(
            ans
        );
    } catch (error) {
        return res.status(500).json({error: error});
    }
}
async function uploadFile(req, res){
    try {
        console.log("uploadFile")
        return res.status(200).json(
            req.body.fileObj
        );
    } catch (error) {
        return res.status(500).json({error: error});
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