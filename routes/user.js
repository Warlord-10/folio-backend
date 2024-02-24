const express = require("express");
const { getAllUser, getUserById, updateUserById, delAllUser, delUserById, getUserProfilePage } = require("../controllers/user");
const verifyTokenMiddleWare = require("../middleware/auth");
const { avatarUploadMiddleware } = require("../middleware/multer");



const router = express.Router();

router.get("/", getAllUser);    // for testing only
router.delete("/", delAllUser); // for testing only

router.get("/page/:uid", getUserProfilePage);
router.get("/s/:uid?", verifyTokenMiddleWare, getUserById);
router.patch("/s/:uid?", verifyTokenMiddleWare, avatarUploadMiddleware.single('file'), updateUserById);
router.delete("/s/:uid?", verifyTokenMiddleWare, delUserById);



module.exports = router;
