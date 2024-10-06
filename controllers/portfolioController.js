const PortfolioItem = require('../model/PortfolioItem');
const User = require('../model/userModel');
const {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} = require('firebase/storage');
const storage = require('../utils/firebaseConfig'); // Import your Firebase storage instance
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

exports.createPortfolioItem = async (req, res) => {
    try {
        const { _id: userId } = req.user;

        // Create a new portfolio item
        const portfolioItem = new PortfolioItem({
            ...req.body,
            user: userId,
        });

        await portfolioItem.save();

        // Add portfolio item to the user's portfolio
        await User.findByIdAndUpdate(userId, {
            $push: { portfolio: portfolioItem._id },
        });

        res.status(201).json({
            message: 'Portfolio item created',
            data: portfolioItem,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.getPortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;
        const portfolioItem = await PortfolioItem.findById(id).populate('user');

        if (!portfolioItem) {
            return res
                .status(404)
                .json({ message: 'Portfolio item not found' });
        }

        res.status(200).json({
            data: portfolioItem,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updatePortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedPortfolioItem = await PortfolioItem.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!updatedPortfolioItem) {
            return res
                .status(404)
                .json({ message: 'Portfolio item not found' });
        }

        res.status(200).json({
            message: 'Portfolio item updated',
            data: updatedPortfolioItem,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deletePortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPortfolioItem = await PortfolioItem.findByIdAndDelete(id);

        if (!deletedPortfolioItem) {
            return res
                .status(404)
                .json({ message: 'Portfolio item not found' });
        }

        res.status(200).json({ message: 'Portfolio item deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllPortfolioItems = async (req, res) => {
    try {
        const id = req.params.id;
        const portfolioItems = await PortfolioItem.find({ user: id });
        res.status(200).json({
            results: portfolioItems.length,
            data: portfolioItems,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
