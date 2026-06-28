const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
    owner_name: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

// Supports the default feed ordering (newest first) with stable pagination.
portfolioSchema.index({ createdAt: -1, _id: -1 });

const PortfolioModel = mongoose.model('Portfolio', portfolioSchema);
module.exports = PortfolioModel;