const mongoose = require("mongoose");
const path = require("path");
const moment = require('moment-timezone');
const { createFolder, removeFolder, createFile } = require("../utils/fileManager");
const linguist = require('linguist-js');


// File Schema
const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  relPath: { type: String, default: null },
  absPath: { type: String, default: null },
  language: { type: String, default: null },
  extension: { type: String, default: null },
  size: { type: Number, default: 0 },
}, { timestamps: true });

fileSchema.pre('save', async function (next) {
  // this.createdAt = moment().tz('Asia/Kolkata').toDate();
  this.name = this.name.replace(/\s+/g, '_');

  const parentFolderPath = await FolderModel.findById(this.parent_id);
  this.relPath = path.join(parentFolderPath.relPath, this.name);
  this.absPath = path.join(parentFolderPath.absPath, this.name);

  const fileNames = [this.name];
  const fileContent = [''];
  const { files, languages, unknown } = await linguist(fileNames, { fileContent });

  this.language = files.results[this.name]
  next();
})

fileSchema.post('save', async function (doc, next) {
  const fullPathOfFile = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc.relPath);
  createFile(fullPathOfFile);
  next();
})

fileSchema.post('deleteOne', { document: true, query: false }, async function (doc, next) {
  const fullPathOfFile = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc.relPath);
  removeFolder(fullPathOfFile);
  next();
})
const FileModel = mongoose.model('File', fileSchema);



// Folder Schema
const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  relPath: { type: String, default: null },
  absPath: { type: String, default: null },
}, { timestamps: true });

folderSchema.pre('save', async function (next) {
  // this.createdAt = moment().tz('Asia/Kolkata').toDate();
  this.name = this.name.replace(/\s+/g, '_');

  // checking for null because each project has a logical root folder
  // which does not have any physical location
  if (this.parent_id !== null) {
    const parentFolderPath = await FolderModel.findById(this.parent_id);
    this.relPath = path.join(parentFolderPath.relPath, this.name);
    this.absPath = path.join(parentFolderPath.absPath, this.name);

    fullPathOfCurrFolder = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, this.relPath);

    createFolder(fullPathOfCurrFolder);
  }
  next();
})

folderSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const folderId = this._id;

  // Find and delete child files
  const childFiles = await FileModel.find({ parent_id: folderId });
  for (const file of childFiles) {
    await file.deleteOne(); // Triggers pre and post hooks for FileModel
  }

  // Find and delete child folders
  const childFolders = await FolderModel.find({ parent_id: folderId });
  for (const folder of childFolders) {
    await folder.deleteOne(); // Triggers pre and post hooks for FolderModel
  }

  next();
});

// Remove from file Id from the parent's list
folderSchema.post('deleteOne', { document: true, query: false }, async function (doc, next) {
  if (doc.parent_id) {
    fullPathOfCurrFolder = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc.relPath);
    removeFolder(fullPathOfCurrFolder);
  }
  next();
});
const FolderModel = mongoose.model('Folder', folderSchema);

module.exports = { FileModel, FolderModel };
