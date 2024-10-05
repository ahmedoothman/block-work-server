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

// Add a method to recalculate totalBalance based on pending and available balances
walletSchema.methods.calculateTotalBalance = function () {
    this.totalBalance = this.pendingBalance + this.availableBalance;
};

// Mongoose middleware to recalculate totalBalance before saving or updating
walletSchema.pre('save', function (next) {
    this.calculateTotalBalance();
    this.updatedAt = Date.now(); // Update the updatedAt field
    next();
});

// Pre-update hook to ensure totalBalance gets updated whenever there is an update
walletSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();

    // If balances are being updated, recalculate totalBalance
    if (update.pendingBalance || update.availableBalance) {
        const newPending =
            update.pendingBalance !== undefined
                ? update.pendingBalance
                : this.pendingBalance;
        const newAvailable =
            update.availableBalance !== undefined
                ? update.availableBalance
                : this.availableBalance;

        update.totalBalance = newPending + newAvailable;
    }

    update.updatedAt = Date.now(); // Update the updatedAt field
    next();
});

module.exports = mongoose.model('Wallet', walletSchema);
