const express = require("express");

const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { getProjectByName } = require("../controllers_v2/project_v2");
const { getFolder_v2, getFile_v2, getFileDetails_v2 } = require("../controllers_v2/repo_v2");


const router = express.Router();

router.use(verifyAccessTokenMiddleWare);

router.get("/:uid/:pname/tree/main/:repo_path(*)?", getFolder_v2);
router.get("/:uid/:pname/blob/main/:repo_path(*)?", getFileDetails_v2);
router.get("/file/:repo_path(*)", getFile_v2);
router.get("/project/:uid/:pname", getProjectByName);


module.exports = router;
