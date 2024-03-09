const express = require("express");
const { makeFile, removeFile, getFolder, makeFolder, removeFolder, getFileData, getFileDetail, uploadFile, updateFile, updateFolder, testFunc } = require("../controllers/repo");
const {verifyTokenMiddleWare} = require("../middleware/auth");
const { fileUploadMiddleware } = require("../middleware/multer");



const router = express.Router();

router.get("/file/data/:fid", getFileData);
router.get("/file/detail/:fid", getFileDetail);
router.post("/file", verifyTokenMiddleWare, makeFile);    
router.patch("/file/:fid", verifyTokenMiddleWare, updateFile);
router.delete("/file/:fid", verifyTokenMiddleWare, removeFile); 

router.post("/file/upload/:fid", verifyTokenMiddleWare, fileUploadMiddleware.array('file'), uploadFile);

router.post("/folder", verifyTokenMiddleWare, makeFolder);
router.get("/folder/:fid", getFolder);
router.patch("/folder/:fid", verifyTokenMiddleWare, updateFolder);
router.delete("/folder/:fid", verifyTokenMiddleWare, removeFolder);

module.exports = router;