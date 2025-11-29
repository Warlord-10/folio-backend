const express = require("express");

const { makeFile, removeFile, getFolder, makeFolder, removeFolder, getFileData, getFileDetail, uploadFile, updateFile, updateFolder, getFile_v2 } = require("../controllers/repo");
const { HardAuthenticationMiddleWare, SoftAuthenticationMiddleWare } = require("../middleware/auth");
const { fileUploadMiddleware } = require("../middleware/multer");


const router = express.Router();

router.post("/file", HardAuthenticationMiddleWare, makeFile);
router.patch("/file/:fid", HardAuthenticationMiddleWare, updateFile);
router.delete("/file/:fid", HardAuthenticationMiddleWare, removeFile);
router.get("/file/data/:fid", SoftAuthenticationMiddleWare, getFileData);
router.get("/file/detail/:fid", SoftAuthenticationMiddleWare, getFileDetail);


router.post("/file/upload/:fid", HardAuthenticationMiddleWare, fileUploadMiddleware.array('file'), uploadFile);


router.post("/folder", HardAuthenticationMiddleWare, makeFolder);
router.get("/folder/:fid", SoftAuthenticationMiddleWare, getFolder);
router.patch("/folder/:fid", HardAuthenticationMiddleWare, updateFolder);
router.delete("/folder/:fid", HardAuthenticationMiddleWare, removeFolder);


module.exports = router;