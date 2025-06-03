const express = require("express");
const { getUserProjects, getProjectById, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");
const {transpileProject_v2} = require("../controllers_v2/project_v2");


const router = express.Router();
router.use(verifyAccessTokenMiddleWare);

router.get("/:uid", getUserProjects);

router.post("/transpile/:pid", transpileProject_v2);
router.post("/s", createProject);
router.get("/s/:pid", getProjectById);
router.patch("/s/:pid", bannerUploadMiddleware.single('banner'), updateProjectById);
router.delete("/s/:pid", delProjectById);



module.exports = router;
