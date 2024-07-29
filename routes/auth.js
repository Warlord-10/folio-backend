const express = require("express");
const { registerUser, loginUser, getSession, logoutUser } = require("../controllers/auth");
const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/session", getSession);
router.get("/logout", logoutUser);

module.exports = router;