const Chat = require('../model/chatModel');
const User = require('../model/userModel');

// Get all chats involving the current user
exports.getAllChats = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming you're using some form of authentication middleware

        // Find all chat threads involving this user
        const chats = await Chat.aggregate([
            {
                $match: {
                    $or: [{ from: userId }, { to: userId }],
                },
            },
            {
                $sort: { timestamp: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $gt: ['$from', '$to'] },
                            { from: '$from', to: '$to' },
                            { from: '$to', to: '$from' },
                        ],
                    },
                    lastMessage: { $first: '$message' },
                    lastTimestamp: { $first: '$timestamp' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.from',
                    foreignField: '_id',
                    as: 'fromUser',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.to',
                    foreignField: '_id',
                    as: 'toUser',
                },
            },
            {
                $project: {
                    _id: 0,
                    fromUser: { $arrayElemAt: ['$fromUser', 0] },
                    toUser: { $arrayElemAt: ['$toUser', 0] },
                    lastMessage: 1,
                    lastTimestamp: 1,
                },
            },
        ]);

        res.status(200).json({
            data: chats,
        });
    } catch (error) {
        console.error('Error getting all chats:', error);
        res.status(500).json({ error: 'Error retrieving chats' });
    }
};

// Get chat history with a specific user
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id; // The currently logged-in user
        const otherUserId = req.params.userId;

        // Find all messages between these two users
        const chatHistory = await Chat.find({
            $or: [
                { from: userId, to: otherUserId },
                { from: otherUserId, to: userId },
            ],
        })
            .sort({ timestamp: 1 })
            .populate('from', 'id name') // Populate 'from' field with 'id' and 'name'
            .populate('to', 'id name'); // Populate 'to' field with 'id' and 'name'; // Sort by ascending order of timestamp

        res.status(200).json({
            data: chatHistory,
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ error: 'Error retrieving chat history' });
    }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
    const userId = req.user._id; // Current user
    const otherUserId = req.params.userId;

    try {
        await Chat.updateMany(
            { from: otherUserId, to: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error marking messages as read' });
    }
};
