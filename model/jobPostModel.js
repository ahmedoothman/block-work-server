const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    budget: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    skillsRequired: {
        type: [String],
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('JobPost', jobPostSchema);
