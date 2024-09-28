const JobPost = require('../model/jobPostModel');
const Proposal = require('../model/proposalModel');
// const Proposal = require('../models/Proposal');

// Create a new job post
exports.createJobPost = async (req, res) => {
    try {
        const {
            title,
            description,
            budget,
            skillsRequired,
            category,
            duration,
        } = req.body;
        const clientId = req.user._id; // Assuming the authenticated client's ID is available

        const jobPost = new JobPost({
            client: clientId,
            title,
            description,
            budget,
            skillsRequired,
            category,
            duration,
        });

        await jobPost.save();
        res.status(201).json({
            message: 'Job post created successfully',
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating job post', error });
    }
};

// Get all job posts
exports.getJobPosts = async (req, res) => {
    try {
        // Find all job posts and populate client data
        const jobPosts = await JobPost.find().populate('client', 'name email');

        // Add proposal count for each job post
        const jobPostsWithProposalCount = await Promise.all(
            jobPosts.map(async (jobPost) => {
                const proposalCount = await Proposal.countDocuments({
                    jobPost: jobPost._id,
                });
                return { ...jobPost.toObject(), proposalCount }; // Merge proposalCount with the job post data
            })
        );

        res.status(200).json({
            results: jobPostsWithProposalCount.length,
            data: jobPostsWithProposalCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job posts', error });
    }
};
// Get a single job post
exports.getJobPost = async (req, res) => {
    try {
        const { jobId } = req.params;
        const jobPost = await JobPost.findById(jobId)
            .populate('client', 'name email')
            .populate('proposals');

        if (!jobPost) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        res.status(200).json({ data: jobPost });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job post', error });
    }
};

// Update a job post
exports.updateJobPost = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { title, description, budget, skillsRequired, category } =
            req.body;

        const updates = {
            title,
            description,
            budget,
            skillsRequired,
            category,
        };
        const jobPost = await JobPost.findByIdAndUpdate(jobId, updates, {
            new: true,
        });

        if (!jobPost) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        res.status(200).json({
            message: 'Job post updated successfully',
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job post', error });
    }
};

// get all job posts by a client
exports.getClientJobPosts = async (req, res) => {
    try {
        const clientId = req.user._id;

        const jobPosts = await JobPost.find({ client: clientId });
        res.status(200).json({ results: jobPosts.length, data: jobPosts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job posts', error });
    }
};
