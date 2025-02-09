const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    portfolio_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portfolio',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure a user can only like a portfolio once
likeSchema.index({ user_id: 1, portfolio_id: 1 }, { unique: true });

const LikeModel = mongoose.model('Like', likeSchema);
module.exports = LikeModel;