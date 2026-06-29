const express = require("express");
const { getUserProjects, getProjectById, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const { softAuth, hardAuth } = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");
const { transpileProject_v2 } = require("../controllers_v2/project_v2");


const router = express.Router();

router.get("/:uid", softAuth, getUserProjects);

router.post("/transpile/:pid", hardAuth, transpileProject_v2);
router.post("/s", hardAuth, createProject);
router.get("/s/:pid", hardAuth, getProjectById);
router.patch("/s/:pid", hardAuth, bannerUploadMiddleware.single('banner'), updateProjectById);
router.delete("/s/:pid", hardAuth, delProjectById);



module.exports = router;
