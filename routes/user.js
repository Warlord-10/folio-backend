const express = require("express");
const { getAllUser, getUserById, updateUserById, delAllUser, delUserById, findUser } = require("../controllers/user");
const { softAuth, hardAuth } = require("../middleware/auth");
const { avatarUploadMiddleware } = require("../middleware/multer");



const router = express.Router();

router.get("/", getAllUser);    // for testing only
router.delete("/", delAllUser); // for testing only

router.get("/s/:uid", softAuth, getUserById);
router.patch("/s/:uid", hardAuth, avatarUploadMiddleware.single('avatar_path'), updateUserById);
router.delete("/s/:uid", hardAuth, delUserById);

router.get("/find", findUser);



module.exports = router;
