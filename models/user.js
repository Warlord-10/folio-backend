const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const path = require("path");
const { createFolder, removeFolder } = require("../fileManager");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  password: {
    type: String, 
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `Email (${props.value}) is invalid!`,
    },
  },

  about: {type: String},
  avatar: {type: String},
  projects : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  userPageProject: {type: String, default: null}
});



userSchema.pre('save', async function(next){
  // hashes the password
  this.password = await bcrypt.hash(this.password, 4);
  next();
})
userSchema.post('save', async function(doc, next){
  // creates the user folder in the storage
  const userRootFolder = path.join(__dirname, ".." ,'db_files',`${doc._id}`)
  createFolder(path.join(userRootFolder, "__user"));
  // createFolder(path.join(__dirname, ".." ,'public',`${doc._id}`))
})


userSchema.pre('deleteOne', {document:true, query:false}, async function (next) {
  // Remove associated projects, and let the cascading deletion handle the rest
  const ProjectModel = require("./project");
  for(let projectId of this.projects){
    const temp = await ProjectModel.findById(projectId);
    await temp.deleteOne()
  }
  next();
});
userSchema.post('deleteOne', {document:true, query:false}, async function(doc, next){
  // removes the user folder from the storage
  const userRootFolder = path.join(__dirname, ".." ,'db_files',`${doc._id}`)
  removeFolder(userRootFolder);
  // removeFolder(path.join(__dirname, ".." ,'public',`${doc._id}`))
})

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;