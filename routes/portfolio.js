const express = require("express");

const { fetchAllPortfolios, addLike, removeLike } = require("../controllers_v2/portfolio_v2");
const {verifyRefreshTokenMiddleWare, verifyAccessTokenMiddleWare} = require("../middleware/auth");

const router = express.Router();
router.use(verifyAccessTokenMiddleWare);

router.get("/all", fetchAllPortfolios);
router.post("/like/:portfolioId", addLike);
router.delete("/like/:portfolioId", removeLike);


module.exports = router;