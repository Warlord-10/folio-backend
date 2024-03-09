const express = require("express");
const { getUserAllProjects, getProjectById, delAllProjects, delProjectById, createProject, updateProjectById, transpileProject } = require("../controllers/project");
const {verifyTokenMiddleWare, userAuthorizationMiddleware} = require("../middleware/auth");
const { bannerUploadMiddleware } = require("../middleware/multer");


const router = express.Router();

router.get("/:uid", getUserAllProjects);
router.delete("/:uid", delAllProjects);

// Id will be taken from jwt
router.post("/s/:uid", userAuthorizationMiddleware, createProject);
router.get("/transpile/:uid", userAuthorizationMiddleware, transpileProject);

router.get("/s/:pid", verifyTokenMiddleWare, getProjectById);
router.patch("/s/:pid", verifyTokenMiddleWare, bannerUploadMiddleware.single('file'), updateProjectById);
router.delete("/s/:pid", verifyTokenMiddleWare, delProjectById);



module.exports = router;