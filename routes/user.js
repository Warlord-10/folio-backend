const express = require("express");
const { getAllUser, getUserById, updateUserById, delAllUser, delUserById, getUserProfilePage, findUser } = require("../controllers/user");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");
const { avatarUploadMiddleware } = require("../middleware/multer");



const router = express.Router();

router.get("/", getAllUser);    // for testing only
router.delete("/", delAllUser); // for testing only

router.get("/s/:uid", verifyAccessTokenMiddleWare, getUserById);
router.patch("/s/:uid", verifyAccessTokenMiddleWare, avatarUploadMiddleware.single('avatar_path'), updateUserById);
router.delete("/s/:uid", verifyAccessTokenMiddleWare, delUserById);

router.get("/page/:uid", getUserProfilePage);

router.get("/find", findUser);



module.exports = router;
