const express = require("express");
const { registerUser, loginUser, logoutUser, getNewAccessToken } = require("../controllers/auth");
const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);
router.post("/refresh", getNewAccessToken);

module.exports = router;