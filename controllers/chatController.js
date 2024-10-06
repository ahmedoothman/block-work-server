const Chat = require('../model/chatModel');
const User = require('../model/userModel');

const moment = require('moment');

exports.getAllChats = async (req, res) => {
    try {
        const userId = req.user._id;

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

        const formattedChats = chats.map((chat) => ({
            ...chat,
            lastTimestamp: moment(chat.lastTimestamp).format(
                'YYYY-MM-DD HH:mm:ss'
            ),
        }));

        // order formattedChats by lastTimestamp
        formattedChats.sort((a, b) => {
            return new Date(b.lastTimestamp) - new Date(a.lastTimestamp);
        });

        res.status(200).json({
            data: formattedChats,
        });
    } catch (error) {
        console.error('Error getting all chats:', error);
        res.status(500).json({ error: 'Error retrieving chats' });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const otherUserId = req.params.userId;

        const chatHistory = await Chat.find({
            $or: [
                { from: userId, to: otherUserId },
                { from: otherUserId, to: userId },
            ],
        })
            .sort({ timestamp: 1 })
            .populate('from', 'id name')
            .populate('to', 'id name');

        res.status(200).json({
            data: chatHistory,
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ error: 'Error retrieving chat history' });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    const userId = req.user._id;
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
