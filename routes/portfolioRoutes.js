const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authController = require('../controllers/authUserController');
const upload = require('../utils/upload'); // Your multer setup for file uploads

router.use(authController.protect); //all the comming is protected

// Route to create a new portfolio item
router.post('/', portfolioController.createPortfolioItem);

router.get('/:id/explore', portfolioController.getAllPortfolioItems);

router.get('/:id', portfolioController.getPortfolioItem);

router.patch('/:id', portfolioController.updatePortfolioItem);

// Route to delete a portfolio item by ID
router.delete('/:id', portfolioController.deletePortfolioItem);

module.exports = router;
