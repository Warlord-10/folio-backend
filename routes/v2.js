const express = require("express");

const { softAuth } = require("../middleware/auth");
const { getProjectByName } = require("../controllers_v2/project_v2");
const { getFolder_v2, getFile_v2, getFileDetails_v2 } = require("../controllers_v2/repo_v2");


const router = express.Router();

router.get("/:uid/:pname/tree/main/:repo_path(*)?", softAuth, getFolder_v2);
router.get("/:uid/:pname/blob/main/:repo_path(*)?", softAuth, getFileDetails_v2);
router.get("/file/:repo_path(*)", softAuth, getFile_v2);
router.get("/project/:uid/:pname", softAuth, getProjectByName);


module.exports = router;
