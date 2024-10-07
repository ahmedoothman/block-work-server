const Wallet = require('../model/walletModel');
const User = require('../model/userModel');
const fs = require('fs');
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

        res.status(200).json({
            data: wallet,
        });
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

        res.status(200).json({
            data: wallet,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateWalletBalanceUtility = async (data) => {
    // data has : clientId,freelancerId, amount // get the wallet of the client and freelancer
    // make the transaction from the client to the freelancer wallet
    const clientWallet = await Wallet.findOne({ user: data.clientId });
    const freelancerWallet = await Wallet.findOne({ user: data.freelancerId });
    if (!clientWallet || !freelancerWallet) {
        return false;
    }
    // suntract 10% from the amount as commission
    const commission = (10 / 100) * +data.amount;
    // save commission to the stats/stats.json file
    // const stats = JSON.parse(fs.readFileSync('stats/stats.json'));
    // stats.totalProfit += commission;
    // fs.writeFileSync('stats/stats.json', JSON.stringify(stats));

    const amountToTransfer = +data.amount - commission;

    // update the balances
    if (clientWallet.availableBalance < +data.amount) {
        return false;
    }
    clientWallet.availableBalance -= +data.amount;

    // update the pending avail of the freelancer
    freelancerWallet.pendingBalance += +amountToTransfer;

    await clientWallet.save();
    await freelancerWallet.save();

    return true;
};

exports.chargeWallet = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { amount } = req.body;

        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        wallet.availableBalance += +amount;

        wallet.updatedAt = Date.now();
        await wallet.save();

        res.status(200).json({
            data: wallet,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
