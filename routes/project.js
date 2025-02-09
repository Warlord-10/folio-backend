const express = require("express");
const { getUserProjects, getProjectById, delAllProjects, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");


const router = express.Router();
router.use(verifyAccessTokenMiddleWare);

router.get("/:uid", getUserProjects);
router.delete("/", delAllProjects);

router.post("/transpile/:pid", transpileProject);
router.post("/s", createProject);
router.get("/s/:pid", getProjectById);
router.patch("/s/:pid", bannerUploadMiddleware.single('banner'), updateProjectById);
router.delete("/s/:pid", delProjectById);



module.exports = router;
