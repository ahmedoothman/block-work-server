const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authController = require('../controllers/authUserController');

router.use(authController.protect);

router.post('/', contractController.createContract);

router.get('/client/my-contracts', contractController.getClientContracts);
router.get(
    '/freelancer/my-contracts',
    contractController.getFreelancerContracts
);

router.patch('/:jobID/status', contractController.updateContractStatus);

module.exports = router;
