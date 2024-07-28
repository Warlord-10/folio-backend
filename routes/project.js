const express = require("express");
const { getUserAllProjects, getProjectById, delAllProjects, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");


const router = express.Router();
router.use(verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare);

router.get("/", getUserAllProjects);
router.delete("/", delAllProjects);

router.get("/transpile", transpileProject);
router.post("/s", createProject);
router.get("/s/:pid", getProjectById);
router.patch("/s/:pid", bannerUploadMiddleware.single('file'), updateProjectById);
router.delete("/s/:pid", delProjectById);



module.exports = router;
