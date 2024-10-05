const express = require('express');
const proposalController = require('../controllers/proposalController');
const authController = require('../controllers/authUserController');
const router = express.Router();

router.use(authController.protect);

router.get(
    '/:jobId/proposals',
    authController.restrictTo('client'),
    proposalController.getProposalsForJob
);
router.patch(
    '/:proposalId/status',
    authController.restrictTo('client'),
    proposalController.updateProposalStatus
);

router.use(authController.restrictTo('freelancer'));
router.get(
    '/freelancer/my-proposals',
    proposalController.getFreelancerProposals
);
router.patch('/:proposalId', proposalController.updateProposal);
router.delete('/:proposalId', proposalController.deleteProposal);
router.post('/:jobId/proposals', proposalController.submitProposal);

module.exports = router;
