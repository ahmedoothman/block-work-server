const express = require('express');
const proposalController = require('../controllers/proposalController');
const authController = require('../controllers/authUserController');
const router = express.Router();

router.use(authController.protect);
// Submit a proposal
router.post('/:jobId/proposals', proposalController.submitProposal);

// Get all proposals for a job post
router.get('/:jobId/proposals', proposalController.getProposalsForJob);

// Get all proposals by a freelancer
router.get(
    '/freelancer/my-proposals',
    proposalController.getFreelancerProposals
);

// Update a proposal
router.patch('/:proposalId', proposalController.updateProposal);

// Delete a proposal
router.delete('/:proposalId', proposalController.deleteProposal);

router.patch('/:proposalId/status', proposalController.updateProposalStatus);
module.exports = router;
