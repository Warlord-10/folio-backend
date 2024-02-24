const mongoose = require("mongoose");
const { FolderModel} = require("./repo");
const fs = require("fs")
const path = require("path");
const { createFolder, removeFolder } = require("../fileManager");


// Project Schema
const projectSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    root: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    title: { type: String, required: true },
    description: { type: String, required: false },
    banner: {type: String}
  }, 
  {timestamps:true}
);


// MIDDLEWARE
// Adds the logical root folder to the project
projectSchema.pre('save', async function(next) {
  if (this.isNew) {
    const folder = await FolderModel.create({
      name: "root_"+`(${this.title})`,
    });
    this.root = folder._id;
  }
  next();
});
// Adds the project to the user
projectSchema.post('save', async function(doc, next) {
  const UserModel = require("./user");
  await UserModel.findByIdAndUpdate(
    doc.owner, 
    { $push: { projects: doc._id } }
  );

  // creates the project folder in the storage
  const userRootFolder = path.join(__dirname, ".." ,'db_files', `${doc.owner}`, `${doc._id}`)
  await FolderModel.findByIdAndUpdate(
    doc.root,
    {relPath: userRootFolder} 
  );
  createFolder(userRootFolder);
  next();
});

// Removes the root folder
projectSchema.pre('deleteOne', {document:true, query:false}, async function(next) {
  const temp = await FolderModel.findById(this.root)
  await temp.deleteOne();
  next();
});
// Removes the project Id from the User.projects
projectSchema.post('deleteOne', {document:true, query:false}, async function(doc, next) {
  const UserModel = require("./user");
  await UserModel.findByIdAndUpdate(doc.owner, {$pull: {projects: doc._id}});

  // removes the project folder from the storage
  const userRootFolder = path.join(__dirname, ".." ,'db_files', `${doc.owner}`, `${doc._id}`)
  removeFolder(userRootFolder);
  next();
});


const ProjectModel = mongoose.model('Project', projectSchema);
module.exports = ProjectModel;

