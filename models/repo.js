const mongoose = require("mongoose");
const path = require("path");
const moment = require('moment-timezone');
const { createFolder, removeFolder } = require("../fileManager");


// File Schema
const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Folder'},
    location: {type: String, default: null},
  },
  {timestamps:true}
);
fileSchema.pre('save', async function(next){
  this.createdAt = moment().tz('Asia/Kolkata').toDate();
  this.name = this.name.replace(/\s+/g,'_');
  next();
})
// Adds the file Id to the folder.files
fileSchema.post('save', async function(doc, next) {
  const parentFolder = await FolderModel.findByIdAndUpdate(
    doc.parent, 
    { $push: {files: doc._id} }
  );
  fullPathOfCurrFile = path.join(`${parentFolder.relPath}`, `${doc.name}`);
  await FileModel.findByIdAndUpdate(doc._id, {location: fullPathOfCurrFile}, {new: true})
  doc.location = fullPathOfCurrFile
  next();
});
fileSchema.post('deleteOne', { document: true, query: false }, async function(doc, next) {
  await FolderModel.findByIdAndUpdate(
    doc.parent,
    { $pull: {files: doc._id} } 
  );

  // remove the file from the storage
  removeFolder(doc.location);
  next();
})
const FileModel = mongoose.model('File', fileSchema);



// Folder Schema
const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null},
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    relPath: {type: String},
  }, 
  {timestamps:true}
);
folderSchema.pre('save', async function(next){
  this.createdAt = moment().tz('Asia/Kolkata').toDate();
  this.name = this.name.replace(/\s+/g,'_');
  next();
})
// Adds the folder to the parent list
folderSchema.post('save', async function(doc, next){
  if(doc.parent !== null){
    const parentFolder = await FolderModel.findByIdAndUpdate(
      doc.parent, 
      { $push: { folders: doc._id } }
    );

    // take the parent's path and add yours on it
    fullPathOfCurrFolder = path.join(`${parentFolder.relPath}`, `${doc.name}`);
    await FolderModel.findByIdAndUpdate(doc._id, {relPath: fullPathOfCurrFolder});
    createFolder(fullPathOfCurrFolder);
  }
  next();
});
// Remove the files and folders from the folder (cascade deletion)
folderSchema.pre('deleteOne', {document:true, query:false}, async function (next) {
  // files = await FileModel.deleteMany({ _id: { $in: this.files } });
  for (let fileId of this.files) {
    const temp = await FileModel.findById(fileId);
    await temp.deleteOne();
  }
  for (let folderId of this.folders) {
    const temp = await FolderModel.findById(folderId);
    await temp.deleteOne();
  }
  next();
});
// Remove from file Id from the parent's list
folderSchema.post('deleteOne', {document:true, query:false}, async function(doc, next) {
  if(doc.parent){
    await FolderModel.findByIdAndUpdate(
      doc.parent,
      { $pull: {folders: doc._id} }
    );
    
    // remove the curr folder from the storage
    removeFolder(doc.relPath);
  }
  next();
});
const FolderModel = mongoose.model('Folder', folderSchema);

module.exports = {FileModel, FolderModel};
  