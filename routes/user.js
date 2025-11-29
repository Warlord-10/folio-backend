const express = require("express");
const { getAllUser, getUserById, updateUserById, delAllUser, delUserById, findUser } = require("../controllers/user");
const { SoftAuthenticationMiddleWare, HardAuthenticationMiddleWare } = require("../middleware/auth");
const { avatarUploadMiddleware } = require("../middleware/multer");



const router = express.Router();

router.get("/", getAllUser);    // for testing only
router.delete("/", delAllUser); // for testing only

router.get("/s/:uid", SoftAuthenticationMiddleWare, getUserById);
router.patch("/s/:uid", HardAuthenticationMiddleWare, avatarUploadMiddleware.single('avatar_path'), updateUserById);
router.delete("/s/:uid", HardAuthenticationMiddleWare, delUserById);

router.get("/find", findUser);



module.exports = router;
