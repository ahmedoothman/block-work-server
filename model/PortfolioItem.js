// models/PortfolioItem.js
const mongoose = require('mongoose');
// models/PortfolioItem.js
const portfolioItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        files: [
            {
                // Changed to an array of strings
                type: String, // URL or path to the file
                required: true,
            },
        ],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PortfolioItem', portfolioItemSchema);
