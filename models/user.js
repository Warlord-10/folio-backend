const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const path = require("path");
const { createFolder, removeFolder } = require("../utils/fileManager");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  email: {
    unique: true,
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

  about: { type: String },
  avatar_path: { type: String },
  user_portfolio: { type: String, default: null }
}, {
  timestamps: true, 
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password; // Remove password field when converting to JSON
      return ret;
    }
  }
}
);



userSchema.pre('save', async function (next) {
  // hashes the password
  this.password = await bcrypt.hash(this.password, 4);
  next();
})
userSchema.post('save', async function (doc, next) {
  // creates the user folder in the storage
  createFolder(path.join(process.cwd(), process.env.USER_FILE_DEST, doc._id.toHexString()));
  createFolder(path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc._id.toHexString()));
  createFolder(path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, doc._id.toHexString()))
  next()
})


userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Remove associated projects, and let the cascading deletion handle the rest
  const ProjectModel = require("./project");
  for (let projectId of this.projects) {
    const temp = await ProjectModel.findById(projectId);
    await temp.deleteOne()
  }
  next();
});
userSchema.post('deleteOne', { document: true, query: false }, async function (doc, next) {
  // removes the user folder from the storage
  removeFolder(path.join(process.cwd(), process.env.USER_FILE_DEST, doc._id.toHexString()));
  removeFolder(path.join(process.cwd(), process.env.PROJECT_FILE_DEST, doc._id.toHexString()));
  removeFolder(path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, doc._id.toHexString()))
  next();
})

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;