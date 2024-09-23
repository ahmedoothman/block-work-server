const express = require('express');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authUserController');
const router = express.Router();

router.use(authController.protect); //all the comming is protected

router.get('/', chatController.getAllChats);
router.get('/:userId', chatController.getChatHistory);
router.post('/:userId', chatController.markMessagesAsRead);

module.exports = router;
