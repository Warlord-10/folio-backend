const express = require("express");

const { makeFile, removeFile, getFolder, makeFolder, removeFolder, getFileData, getFileDetail, uploadFile, updateFile, updateFolder, getFile_v2 } = require("../controllers/repo");
const { hardAuth, softAuth } = require("../middleware/auth");
const { fileUploadMiddleware } = require("../middleware/multer");


const router = express.Router();

router.post("/file", hardAuth, makeFile);
router.patch("/file/:fid", hardAuth, updateFile);
router.delete("/file/:fid", hardAuth, removeFile);
router.get("/file/data/:fid", softAuth, getFileData);
router.get("/file/detail/:fid", softAuth, getFileDetail);


router.post("/file/upload/:fid", hardAuth, fileUploadMiddleware.array('file'), uploadFile);


router.post("/folder", hardAuth, makeFolder);
router.get("/folder/:fid", softAuth, getFolder);
router.patch("/folder/:fid", hardAuth, updateFolder);
router.delete("/folder/:fid", hardAuth, removeFolder);


module.exports = router;