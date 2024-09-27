const express = require('express');
const router = express.Router();
const authController = require('../controllers/authUserController');
const reviewController = require('../controllers/reviewContract');

router.use(authController.protect);
/* 
const catchAsync = require('../utils/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {
    // we want client id and freelancer id and the details of the review
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    // get all reviews of the freelancer or client
});

exports.getReview = catchAsync(async (req, res, next) => {
    // get the review details
});

exports.updateReview = catchAsync(async (req, res, next) => {
    // update the review details
});

*/

router.post('/', reviewController.createReview);
router.get('/', reviewController.getAllReviews);
router.get('/:reviewId', reviewController.getReview);
router.patch('/:reviewId', reviewController.updateReview);

module.exports = router;
