const User = require('../model/userModel');
const Review = require('../model/reviewModel');
const catchAsync = require('../utils/catchAsync');
const { ethers } = require('ethers');
const reviewContractABI = require('../ABI/reviewContractABI.json');
const { format } = require('morgan');
const providerUrl = process.env.ETHEREUM_PROVIDER_URL;
const MODE = 'LOCAL'; // 'BLOCKCHAIN' or 'LOCAL'

exports.createReview = catchAsync(async (req, res, next) => {
    const reviewer = req.user._id;
    const { reviewee, comment, rating } = req.body;

    if (MODE === 'BLOCKCHAIN') {
        const provider = new ethers.JsonRpcProvider(providerUrl);
        const privateKey = process.env.WALLET_PRIVATE_KEY;

        const wallet = new ethers.Wallet(privateKey, provider);

        const contractAddress = process.env.REVIEW_CONTRACT_ADDRESS;

        const contract = new ethers.Contract(
            contractAddress,
            reviewContractABI,
            wallet
        );

        const tx = await contract.createReview(
            reviewer.toString(),
            reviewee.toString(),
            comment,
            rating.toString()
        );

        const receipt = await tx.wait();

        // get the client and freelancer
        const client = await User.findById(reviewer);
        const freelancer = await User.findById(reviewee);
        res.status(201).json({
            status: 'success',
            data: {
                client: client,
                freelancer: freelancer,
                comment: comment,
                rating: rating.toString(),
                transactionHash: receipt.transactionHash,
            },
        });
    } else {
        const review = await Review.create({
            reviewer,
            reviewee,
            comment,
            rating,
        });

        res.status(201).json({
            status: 'success',
            data: review,
        });
    }
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const reviewee = req.params.revieweeId;
    if (MODE === 'BLOCKCHAIN') {
        const provider = new ethers.JsonRpcProvider(providerUrl);
        const contractAddress = process.env.REVIEW_CONTRACT_ADDRESS;
        const contract = new ethers.Contract(
            contractAddress,
            reviewContractABI,
            provider
        );

        const reviews = await contract.getReviewsByReviewee(reviewee);
        const formatedReviews = await Promise.all(
            reviews.map(async (review) => {
                const reviewer = await User.findById(review[0]);
                const reviewee = await User.findById(review[1]);

                return {
                    reviewer,
                    reviewee,
                    comment: review[2],
                    rating: review[3].toString(),
                };
            })
        );
        res.status(200).json({
            status: 'success',
            data: formatedReviews,
        });
    } else {
        const reviews = await Review.find({ reviewee: reviewee });
        res.status(200).json({
            status: 'success',
            data: reviews,
        });
    }
});

exports.getReview = catchAsync(async (req, res, next) => {
    // get the review details
});

exports.updateReview = catchAsync(async (req, res, next) => {
    // update the review details
});
