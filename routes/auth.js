const express = require("express");
const { registerUser, loginUser, logoutUser } = require("../controllers/auth");
const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);
// router.post("/refresh", refresh);

module.exports = router;