const multer = require("multer");
const path = require("path");
const { FileModel } = require("../models/repo");
const ProjectModel = require("../models/project");
const { createFolder } = require("../utils/fileManager");


const fileFilter = (req, file, cb) => {
  // Check if file type is image
  if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
  } else {
      cb(new Error('Only image files are allowed'), false); // Reject the file
  }
}

// For uploading files
const fileUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const newFile = await FileModel.create({
        name: file.originalname,
        parent_id: req.params.fid,
        size: file.size,
        extension: path.extname(file.originalname)
      })
      const filePath = newFile.relPath.slice(0, newFile.relPath.lastIndexOf("\\"))
      return cb(null, path.join(process.cwd(), process.env.PROJECT_FILE_DEST, filePath))

    } catch (error) {
      console.log(error);
    }
  },
  filename: function (req, file, cb) {
    return cb(null, file.originalname)
  }
})})


// For uploading avatar/profile picture
const avatarUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const fullPath = path.join(process.cwd(), process.env.USER_FILE_DEST, `${req.params.uid}`)
      return cb(null, fullPath);
    } catch (error) {
      console.log(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      req.body.avatar_path = `${req.params.uid}/avatar.jpeg`
      return cb(null, "avatar.jpeg")
    } catch (error) {
      console.log(error);
    }  
  }
}),fileFilter: fileFilter})


// For uploading project banner
const bannerUploadMiddleware = multer({storage: multer.diskStorage({
  destination: async function(req, file, cb){
    try {
      const project = await ProjectModel.findById(req.params.pid)
      const fullPath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, project.owner_id.toHexString(), project.title)
      req.body.banner_path = path.join(project.owner_id.toHexString(), project.title, "project_banner.jpeg");
      return cb(null, fullPath)

    } catch (error) {
      console.log(error);
    }
  },
  filename: function(req, file, cb){
    return cb(null, `project_banner.jpeg`)
  }
}), fileFilter: fileFilter});


module.exports = {fileUploadMiddleware, avatarUploadMiddleware, bannerUploadMiddleware};