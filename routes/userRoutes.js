const express = require('express');

// const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authUserController');
const walletController = require('../controllers/walletController');
const router = express.Router();

router.post('/signup', authController.signup, walletController.createWallet);
router.post('/login', authController.login);
module.exports = router;
