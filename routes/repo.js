const express = require("express");

const { makeFile, removeFile, getFolder, makeFolder, removeFolder, getFileData, getFileDetail, uploadFile, updateFile, updateFolder, getFile_v2 } = require("../controllers/repo");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { fileUploadMiddleware } = require("../middleware/multer");


const router = express.Router();
exports.router = router;
router.use(verifyAccessTokenMiddleWare);

router.post("/file", makeFile);
router.patch("/file/:fid", updateFile);
router.delete("/file/:fid", removeFile);
router.get("/file/data/:fid", getFileData);
router.get("/file/detail/:fid", getFileDetail);


router.post("/file/upload/:fid", fileUploadMiddleware.array('file'), uploadFile);


router.post("/folder", makeFolder);
router.get("/folder/:fid", getFolder);
router.patch("/folder/:fid", updateFolder);
router.delete("/folder/:fid", removeFolder);


module.exports = router;