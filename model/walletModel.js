const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Each user should have only one wallet
    },
    totalBalance: {
        type: Number,
        default: 0,
    },
    pendingBalance: {
        type: Number,
        default: 0,
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Wallet', walletSchema);
