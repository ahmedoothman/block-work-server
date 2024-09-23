const Wallet = require('../model/walletModel');
const User = require('../model/userModel');

// Get wallet details by user ID
exports.getWallet = async (req, res) => {
    try {
        // get user id from the token
        const userId = req.user.id;
        const wallet = await Wallet.findOne({ user: userId }).populate(
            'transactions'
        );

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        res.status(200).json(wallet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Create a wallet for a user (this can be called upon user registration or approval)
exports.createWallet = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if the user already has a wallet
        const existingWallet = await Wallet.findOne({ user: userId });
        if (existingWallet) {
            return res
                .status(400)
                .json({ message: 'Wallet already exists for this user' });
        }

        const newWallet = new Wallet({
            user: userId,
        });
        const user = req.user;

        await newWallet.save();
        res.status(201).json({
            user,
            newWallet,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update wallet balances (example: adding funds, moving from pending to available)
exports.updateWalletBalance = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { totalBalance, pendingBalance, availableBalance } = req.body;

        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Update balances
        if (totalBalance !== undefined) wallet.totalBalance = totalBalance;
        if (pendingBalance !== undefined)
            wallet.pendingBalance = pendingBalance;
        if (availableBalance !== undefined)
            wallet.availableBalance = availableBalance;

        wallet.updatedAt = Date.now();
        await wallet.save();

        res.status(200).json(wallet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
