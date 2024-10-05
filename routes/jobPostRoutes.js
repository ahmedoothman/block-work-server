const express = require('express');
const jobPostController = require('../controllers/jobPostController');
const authController = require('../controllers/authUserController');
const router = express.Router();

router.use(authController.protect);

// Get all job posts
router.get('/', jobPostController.getJobPosts);

// Get a single job post by ID
router.get('/:jobId', jobPostController.getJobPost);

router.use(authController.restrictTo('client'));
// Create a new job post
router.post('/', jobPostController.createJobPost);
// Delete a single job post by ID
router.delete('/:jobId', jobPostController.deleteJobPost);

// Update a job post
router.patch('/:jobId', jobPostController.updateJobPost);

// Get all job posts by a client
router.get(
    '/client/my-posts',

    jobPostController.getClientJobPosts
);

module.exports = router;
