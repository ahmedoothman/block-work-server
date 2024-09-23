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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
}).array('images', 5); // Limit to 5 files, adjust as needed

exports.createPortfolioItem = [
    upload, // Use the updated multer configuration
    async (req, res) => {
        try {
            const { _id: userId } = req.user;
            const { title, description } = req.body;
            const files = req.files; // Access the uploaded files

            if (!files || files.length === 0) {
                return res
                    .status(400)
                    .json({ message: 'At least one file is required' });
            }

            const fileUrls = [];

            // Loop through each uploaded file and upload to Firebase
            for (const file of files) {
                const fileRef = ref(
                    storage,
                    `portfolio/${uuidv4()}${path.extname(file.originalname)}`
                );

                await uploadBytes(fileRef, file.buffer);
                const fileUrl = await getDownloadURL(fileRef);
                fileUrls.push(fileUrl); // Add the URL to the array
            }

            // Create a new portfolio item
            const portfolioItem = new PortfolioItem({
                title,
                description,
                files: fileUrls, // Save the array of file URLs
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
    },
];

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

exports.updatePortfolioItem = [
    upload, // Use the updated multer configuration
    async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description } = req.body;

            const updates = { title, description };
            const fileUrls = [];

            // Handle file update if files are provided
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const fileRef = ref(
                        storage,
                        `portfolio/${uuidv4()}${path.extname(
                            file.originalname
                        )}`
                    );

                    await uploadBytes(fileRef, file.buffer);
                    const fileUrl = await getDownloadURL(fileRef);
                    fileUrls.push(fileUrl); // Add the new URL to the array
                }
                updates.files = fileUrls; // Update the files array
            }

            const updatedPortfolioItem = await PortfolioItem.findByIdAndUpdate(
                id,
                updates,
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
    },
];

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
        const { id: userId } = req.user;
        const portfolioItems = await PortfolioItem.find({ user: userId });
        res.status(200).json({
            results: portfolioItems.length,
            data: portfolioItems,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
