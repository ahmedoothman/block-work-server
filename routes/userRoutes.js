const express = require('express');

// const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authUserController');
const walletController = require('../controllers/walletController');
const router = express.Router();

router.post('/signup', authController.signup, walletController.createWallet);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:code', authController.resetPassword);
router.use(authController.protect);
router.patch('/updateMe', userController.updateMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.get('/:id', userController.getUser);
module.exports = router;
