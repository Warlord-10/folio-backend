const mongoose = require("mongoose");
const { FolderModel } = require("./repo");
const fs = require("fs")
const path = require("path");
const { createFolder, removeFolder } = require("../utils/fileManager");


// Project Schema
const projectSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  root_folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  title: { type: String, required: true },
  description: { type: String, required: false },
  banner_path: { type: String },
  metadata: { type: Object, default: {} },
}, { timestamps: true });


// MIDDLEWARE

// Adding a logical root folder to the project
projectSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.root_folder = this._id;
  }
  next();
});

// Creating the project folder in the file system
projectSchema.post('save', async function (doc, next) {
  const projectRootFolder = path.join(doc.owner_id.toHexString(), doc.title)

  const folder = await FolderModel.create({
    name: doc.title,
    _id: doc._id,
    relPath: projectRootFolder,
    absPath: ""
  });

  createFolder(path.join(process.cwd(), process.env.PROJECT_FILE_DEST, projectRootFolder));
  next();
});

// Removes the root folder
projectSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (next) {
  await FolderModel.deleteOne({ _id: this._id });
  next();
});

// Removes physical project folder
projectSchema.post(['deleteOne', 'findOneAndDelete'], { document: true, query: false }, async function (doc, next) {
  const projectFolder = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc.owner_id.toHexString(), doc.title);

  removeFolder(projectFolder);
  next();
});


const ProjectModel = mongoose.model('Project', projectSchema);
module.exports = ProjectModel;

