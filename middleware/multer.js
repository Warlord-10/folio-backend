const multer = require("multer");
const path = require("path");
const { FileModel } = require("../models/repo");
const ProjectModel = require("../models/project");
const { createFolder } = require("../fileManager");


const fileFilter = (req, file, cb) => {
  // Check if file type is image
  if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
  } else {
      cb(new Error('Only image files are allowed'), false); // Reject the file
  }
}

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
      const fullPath = path.join(__dirname, "..", "db_files", `${req.params.uid}`, '__user')
      return cb(null, fullPath);
    } catch (error) {
      console.log(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      req.body.avatar = `${req.params.uid}/__user/avatar.jpeg`
      return cb(null, "avatar.jpeg")
    } catch (error) {
      console.log(error);
    }  
  }
}),fileFilter: fileFilter})

const bannerUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function(req, file, cb){
    try {
      const project = await ProjectModel.findById(req.params.pid)
      const fullPath = path.join(__dirname, "..", "db_files", `${project.owner}`, '__user')
      req.body.banner = `${project.owner}/__user/`
      return cb(null, fullPath)
    } catch (error) {
      console.log(error);
    }
  },
  filename: function(req, file, cb){
    req.body.banner = req.body.banner+`${req.params.pid}.jpeg`
    return cb(null, `${req.params.pid}.jpeg`)
  }
}), fileFilter: fileFilter});


module.exports = {fileUploadMiddleware, avatarUploadMiddleware, bannerUploadMiddleware};