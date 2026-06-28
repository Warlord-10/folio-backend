const PortfolioModel = require("../models/portfolio.js");
const LikeModel = require('../models/likes.js');
const { logError, logInfo } = require("../utils/logger.js");
const { cacheKeys, getCache, setCache, delByPattern } = require("../utils/cache.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");

const PAGE_LIMIT = 10;

// Fetch all portfolios from the DB
const fetchAllPortfolios = asyncHandler(async (req, res) => {
    logInfo("fetchAllPortfolios");
    const userId = req.user?._id || null;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = PAGE_LIMIT;
    const skip = (page - 1) * limit;
    const cacheKey = cacheKeys.portfolioPage(page, limit);

    // The page of portfolios + total count is public and shared across users — cache it.
    // The per-user `isLiked` overlay is computed fresh below.
    let pageData = await getCache(cacheKey);
    if (!pageData) {
        const [items, total] = await Promise.all([
            // Stable sort is required for deterministic pagination.
            PortfolioModel.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
            PortfolioModel.estimatedDocumentCount(),
        ]);

        pageData = {
            items,
            pagination: {
                totalItems: total,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
            },
        };
        await setCache(cacheKey, pageData, 60); // 1 minute
    }

    // Per-user overlay: which of these portfolios has the current user liked?
    let likedSet = new Set();
    if (userId && pageData.items.length) {
        const ids = pageData.items.map((p) => p._id);
        const liked = await LikeModel.find({ user_id: userId, portfolio_id: { $in: ids } })
            .select("portfolio_id")
            .lean();
        likedSet = new Set(liked.map((l) => l.portfolio_id.toString()));
    }

    const data = pageData.items.map((p) => ({
        ...p,
        isLiked: likedSet.has(p._id.toString()),
    }));

    return res.status(200).json({
        data,
        pagination: pageData.pagination,
    });
});


// Fetch featured portfolios
const fetchFeaturedPortfolios = asyncHandler(async (req, res) => {
    logInfo("fetchFeaturedPortfolios");
    const featuredPortfolios = null;
    return res.status(200).json(featuredPortfolios);
});


// Add a like
const addLike = asyncHandler(async (req, res) => {
    logInfo("addLike");
    const { portfolioId } = req.params;
    const userId = req.user?._id || null;
    if (!userId) throw new AppError(401, "Unauthorized");

    // Create the like first. The unique compound index prevents double-likes;
    // only increment the counter when a new like was actually inserted.
    try {
        await LikeModel.create({ user_id: userId, portfolio_id: portfolioId });
    } catch (err) {
        if (err.code === 11000) {
            const existing = await PortfolioModel.findById(portfolioId).select("likes").lean();
            return res.status(200).json({ message: 'Already liked', totalLikes: existing?.likes ?? 0 });
        }
        throw err;
    }

    const portfolioData = await PortfolioModel.findByIdAndUpdate(
        portfolioId,
        { $inc: { likes: 1 } },
        { new: true }
    );

    // Like counts changed -> invalidate cached portfolio pages.
    await delByPattern("portfolio:page:*");

    return res.status(200).json({ message: 'Portfolio liked successfully', totalLikes: portfolioData.likes });
});


// Remove a like
const removeLike = asyncHandler(async (req, res) => {
    logInfo("removeLike");
    const { portfolioId } = req.params;
    const userId = req.user?._id || null;
    if (!userId) throw new AppError(401, "Unauthorized");

    // Only decrement if a like was actually removed (avoids negative counts).
    const removed = await LikeModel.findOneAndDelete({
        user_id: userId,
        portfolio_id: portfolioId
    });
    if (!removed) {
        const existing = await PortfolioModel.findById(portfolioId).select("likes").lean();
        return res.status(200).json({ message: 'Not liked', totalLikes: existing?.likes ?? 0 });
    }

    const portfolioData = await PortfolioModel.findByIdAndUpdate(
        portfolioId,
        { $inc: { likes: -1 } },
        { new: true }
    );

    await delByPattern("portfolio:page:*");

    return res.status(200).json({ message: 'Portfolio unliked successfully', totalLikes: portfolioData.likes });
});

module.exports = {
    fetchAllPortfolios,
    fetchFeaturedPortfolios,
    addLike,
    removeLike,
};
