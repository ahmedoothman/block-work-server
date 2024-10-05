const JobPost = require('../model/jobPostModel');
const Proposal = require('../model/proposalModel');
const contractController = require('../controllers/contractController');
exports.submitProposal = async (req, res) => {
    try {
        const { jobId } = req.params;
        const freelancerId = req.user._id;
        const { coverLetter, proposedAmount, duration } = req.body;

        const jobPost = await JobPost.findById(jobId);

        // check if the freelancer has already submitted a proposal for this job
        const existingProposal = await Proposal.findOne({
            jobPost: jobId,
            freelancer: freelancerId,
        });
        if (existingProposal) {
            return res
                .status(400)
                .json({
                    message:
                        'You have already submitted a proposal for this job',
                });
        }

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
            'freelancer'
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
        }).populate('jobPost');

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

        // create a contract if status is accepted
        if (status === 'accepted') {
            const response = await contractController.createContractUtility({
                clientId: req.user._id,
                freelancerId: proposal.freelancer,
                jobID: proposal.jobPost,
                amount: proposal.proposedAmount,
                duration: proposal.duration,
            });
            if (response.status !== 'success') {
                return res.status(500).json({
                    message: 'Error creating contract',
                });
            }
        }

        // update job post status to 'in progress' if proposal is accepted
        if (status === 'accepted') {
            await JobPost.findByIdAndUpdate(proposal.jobPost, {
                status: 'in-progress',
            });
        }

        // update job post status to 'open' if proposal is rejected
        if (status === 'rejected') {
            await JobPost.findByIdAndUpdate(proposal.jobPost, {
                status: 'open',
            });
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
