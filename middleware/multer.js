const multer = require("multer");
const path = require("path");
const { FileModel } = require("../models/repo");
const ProjectModel = require("../models/project");
const { createFolder } = require("../fileManager");


const fileUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const newFile = await FileModel.create({
        name: file.originalname,
        parent: req.params.fid
      })
      req.body.fileObj = newFile
      return cb(null, path.dirname(newFile.location))
    } catch (error) {
      console.log(error);
    }
  },
  filename: function (req, file, cb) {
    return cb(null, file.originalname)
  }
})})

const avatarUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      createFolder(path.join(__dirname, "..", "public", `${req.params.uid}`))
      return cb(null, path.join(__dirname, "..", "public", `${req.params.uid}`))
    } catch (error) {
      console.log(error);
    }
  },
  filename: function (req, file, cb) {
    return cb(null, "avatar" + path.extname(file.originalname))
  }
})})

const bannerUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function(req, file, cb){
    try {
      const project = await ProjectModel.findById(req.params.pid)
      return cb(null, path.join(__dirname, "..", "public", `${project.owner}`))
    } catch (error) {
      console.log(error);
    }
  },
  filename: function(req, file, cb){
    return cb(null, `${req.params.pid}` + path.extname(file.originalname))
  }
})});


module.exports = {fileUploadMiddleware, avatarUploadMiddleware, bannerUploadMiddleware};
// module.exports = upload.array('file');