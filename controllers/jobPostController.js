const JobPost = require('../model/jobPostModel');
const Proposal = require('../model/proposalModel');

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
        const clientId = req.user._id;

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

exports.getJobPosts = async (req, res) => {
    try {
        // Find job posts with status 'open'
        const jobPosts = await JobPost.find({ status: 'open' }).populate(
            'client',
            'name email country'
        );

        const jobPostsWithProposalCount = await Promise.all(
            jobPosts.map(async (jobPost) => {
                const proposalCount = await Proposal.countDocuments({
                    jobPost: jobPost._id,
                });
                return { ...jobPost.toObject(), proposalCount };
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

exports.getClientJobPosts = async (req, res) => {
    try {
        const clientId = req.user._id;

        const jobPosts = await JobPost.find({ client: clientId });
        res.status(200).json({ results: jobPosts.length, data: jobPosts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job posts', error });
    }
};

exports.deleteJobPost = async (req, res) => {
    try {
        const { jobId } = req.params;

        const jobPost = await JobPost.findByIdAndDelete(jobId);

        if (!jobPost) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        res.status(204).json({ message: 'Job post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job post', error });
    }
};
