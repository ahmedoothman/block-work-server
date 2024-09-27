const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authController = require('../controllers/authUserController');

router.use(authController.protect);

router.post('/', contractController.setUserInfo);
router.get('/', contractController.getUserInfo);
router.get('/:contractId', contractController.getContract);
router.get('/client/my-contracts', contractController.getClientContracts);
router.get(
    '/freelancer/my-contracts',
    contractController.getFreelancerContracts
);

router.patch('/:contractId/status', contractController.updateContractStatus);

module.exports = router;
