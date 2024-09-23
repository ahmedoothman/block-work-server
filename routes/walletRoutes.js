const express = require('express');
const {
    getWallet,
    createWallet,
    updateWalletBalance,
} = require('../controllers/walletController'); // Adjust the path as necessary

const authController = require('../controllers/authUserController');
const router = express.Router();

router.use(authController.protect);
// Route to get wallet details by user ID
router.get('/', getWallet);
// Route to create a wallet for a user
router.post('/create', createWallet);
// Route to update wallet balances
router.patch('/updateWallet', updateWalletBalance);

module.exports = router;
