const express = require('express');
const router = express.Router();
const authController = require('../controllers/authUserController');
const reviewController = require('../controllers/reviewContract');

router.use(authController.protect);

router.post('/', reviewController.createReview);
router.get('/:revieweeId', reviewController.getAllReviews);
router.get('/:reviewId', reviewController.getReview);
router.patch('/:reviewId', reviewController.updateReview);

module.exports = router;
