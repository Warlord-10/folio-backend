const express = require("express");

const { fetchAllPortfolios, addLike, removeLike } = require("../controllers_v2/portfolio_v2");
const { SoftAuthenticationMiddleWare, HardAuthenticationMiddleWare } = require("../middleware/auth");

const router = express.Router();

router.get("/all", SoftAuthenticationMiddleWare, fetchAllPortfolios);
router.post("/like/:portfolioId", HardAuthenticationMiddleWare, addLike);
router.delete("/like/:portfolioId", HardAuthenticationMiddleWare, removeLike);


module.exports = router;