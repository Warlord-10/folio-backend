const express = require("express");
const { getUserProjects, getProjectById, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const { SoftAuthenticationMiddleWare, HardAuthenticationMiddleWare } = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");
const { transpileProject_v2 } = require("../controllers_v2/project_v2");


const router = express.Router();

router.get("/:uid", SoftAuthenticationMiddleWare, getUserProjects);

router.post("/transpile/:pid", HardAuthenticationMiddleWare, transpileProject_v2);
router.post("/s", HardAuthenticationMiddleWare, createProject);
router.get("/s/:pid", HardAuthenticationMiddleWare, getProjectById);
router.patch("/s/:pid", HardAuthenticationMiddleWare, bannerUploadMiddleware.single('banner'), updateProjectById);
router.delete("/s/:pid", HardAuthenticationMiddleWare, delProjectById);



module.exports = router;
