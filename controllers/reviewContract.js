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
