const JobPost = require('../model/jobPostModel');
const Proposal = require('../model/proposalModel');

exports.submitProposal = async (req, res) => {
    try {
        const { jobId } = req.params;
        const freelancerId = req.user._id;
        const { coverLetter, proposedAmount, duration } = req.body;

        const jobPost = await JobPost.findById(jobId);

        if (!jobPost) {
            return res.status(404).json({ message: 'Job post not found' });
        }

        const proposal = new Proposal({
            jobPost: jobId,
            freelancer: freelancerId,
            coverLetter,
            proposedAmount,
            duration,
        });

        await proposal.save();

        res.status(201).json({
            message: 'Proposal submitted successfully',
            data: proposal,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting proposal', error });
    }
};

// Get all proposals for a job post
exports.getProposalsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const proposals = await Proposal.find({ jobPost: jobId }).populate(
            'freelancer',
            'name email'
        );

        res.status(200).json({ results: proposals.length, data: proposals });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching proposals', error });
    }
};

// Get all proposals by a freelancer
exports.getFreelancerProposals = async (req, res) => {
    try {
        const freelancerId = req.user._id;

        const proposals = await Proposal.find({
            freelancer: freelancerId,
        }).populate('jobPost', 'title');

        res.status(200).json({ results: proposals.length, data: proposals });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching proposals', error });
    }
};

// Update a proposal
exports.updateProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const { coverLetter, proposedAmount } = req.body;

        const proposal = await Proposal.findByIdAndUpdate(
            proposalId,
            { coverLetter, proposedAmount },
            { new: true }
        );

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        res.status(200).json({
            message: 'Proposal updated successfully',
            data: proposal,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating proposal', error });
    }
};

// Delete a proposal
exports.deleteProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;

        await Proposal.findByIdAndDelete(proposalId);

        res.status(200).json({ message: 'Proposal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting proposal', error });
    }
};

// Update a proposal status
exports.updateProposalStatus = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const proposal = await Proposal.findByIdAndUpdate(
            proposalId,
            { status },
            { new: true }
        );

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        res.status(200).json({
            message: 'Proposal status updated successfully',
            data: proposal,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating proposal status',
            error,
        });
    }
};
