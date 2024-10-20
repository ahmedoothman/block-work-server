// models/contractModel.js
const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPost',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
    },
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
