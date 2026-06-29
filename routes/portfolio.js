const express = require("express");

const { fetchAllPortfolios, addLike, removeLike } = require("../controllers_v2/portfolio_v2");
const { softAuth, hardAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/all", softAuth, fetchAllPortfolios);
router.post("/like/:portfolioId", hardAuth, addLike);
router.delete("/like/:portfolioId", hardAuth, removeLike);


module.exports = router;