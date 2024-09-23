const express = require('express');

// const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect); //all the comming is protected

router.use(authController.restrictTo('admin'));
router.route('/users').get(userController.getAllUsers);

router
    .route('/users/:id')
    .get(userController.getUser)
    .patch(userController.verifyUser);

module.exports = router;
