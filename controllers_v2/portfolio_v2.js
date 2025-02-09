const PortfolioModel = require("../models/portfolio.js");
const LikeModel = require('../models/likes.js');
const logger = require("../utils/logger.js");

// async function fetchAllPortfolios(req, res) {
//     console.log("fetchAllPortfolios");
//     try {
//         const userId = req.user?.userId || null;
//         const page = parseInt(req.query.page) || 1;
//         const limit = 10; // Number of items per page

//         // Calculate the number of items to skip
//         const skip = (page - 1) * limit;

//         // Get total number of items
//         const total = await PortfolioModel.countDocuments();

//         // Calculate total pages
//         const totalPages = Math.ceil(total / limit);

//         // Fetch the items for the current page
//         const response = await PortfolioModel.find()
//             .skip(skip)
//             .limit(limit)
//             // .exec();

//         // Create pagination response
//         const pagination = {
//             totalItems: total,
//             currentPage: page,
//             itemsPerPage: limit,
//             totalPages: totalPages
//         };

//         return res.status(200).json({
//             data: response,
//             pagination: pagination
//         });

//     } catch (error) {
//         logger(error)
//         return res.status(500).json({ message: "Error fetching portfolios" });
//     }
// }


async function fetchAllPortfolios(req, res) {
    console.log("fetchAllPortfolios");
    try {
        const userId = req.user?.userId || null; // Assuming user's ID is available in req.user
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;

        // Get total number of items
        const total = await PortfolioModel.countDocuments();

        // Fetch the IDs of portfolios liked by the current user
        const likedPortfolioIds = await LikeModel.find({ user_id: userId })
                                                .select('portfolio_id')
                                                .lean()
                                                .then(results => results.map(result => result.portfolio_id));


        // Fetch the items for the current page with an additional 'isLiked' field
        const response = await PortfolioModel.aggregate([
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $addFields: {
                    isLiked: {
                        $in: ['$_id', likedPortfolioIds]
                    }
                }
            }
        ]);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        const pagination = {
            totalItems: total,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: totalPages
        };

        return res.status(200).json({
            data: response,
            pagination: pagination
        });

    } catch (error) {
        logger(error);
        return res.status(500).json({ message: "Error fetching portfolios" });
    }
}



// Add a like
async function addLike(req, res) {
    console.log("addLike")
    try {
        const { portfolioId } = req.params;
        const userId = req.user.userId;

        // Create a new like
        await LikeModel.create({
            user_id: userId,
            portfolio_id: portfolioId
        });

        // Increment the likes count
        const portfolioData = await PortfolioModel.findByIdAndUpdate(
            portfolioId,
            { $inc: { likes: 1 } },
            { new: true }
        );

        res.status(200).json({ message: 'Portfolio liked successfully', totalLikes: portfolioData.likes });
    } catch (error) {
        logger(error);
        res.status(500).json({ message: 'Error adding like' });
    }
}

// Remove a like
async function removeLike(req, res) {
    console.log("removeLike");
    try {
        const { portfolioId } = req.params;
        const userId = req.user.userId;

        // Find and remove the like
        await LikeModel.findOneAndDelete({
            user_id: userId,
            portfolio_id: portfolioId
        });

        // Decrement the likes count
        const portfolioData = await PortfolioModel.findByIdAndUpdate(
            portfolioId,
            { $inc: { likes: -1 } },
            { new: true }
        );

        res.status(200).json({ message: 'Portfolio unliked successfully', totalLikes: portfolioData.likes });
    } catch (error) {
        logger(error);
        res.status(500).json({ message: 'Error removing like' });
    }
}

module.exports = {
    fetchAllPortfolios,
    addLike,
    removeLike,
};