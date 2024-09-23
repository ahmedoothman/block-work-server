// middleware/upload.js
const multer = require('multer');

// Set storage engine
const storage = multer.memoryStorage(); // Store files in memory for easy access

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Acceptable file types
        const extname =
            fileTypes.test(file.mimetype) &&
            fileTypes.test(file.originalname.split('.').pop().toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(
                'Error: File upload only supports the following filetypes - ' +
                    fileTypes
            );
        }
    },
});

module.exports = upload;
