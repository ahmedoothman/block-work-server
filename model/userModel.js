const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name '],
        trim: true,
    },
    socketId: String,
    email: {
        type: String,
        required: [true, 'User must have a email '],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email'],
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['client', 'freelancer'],
        default: 'user',
    },

    verified: {
        type: Boolean,
        default: false,
        select: true,
    },
    accountCreatedAt: {
        type: Date,
        required: [false],
        default: new Date(),
    },
    phone: {
        type: String,
        required: true,
    },
    nationalId: {
        type: String,
        required: true,
    },
    frontIdPhotoUrl: {
        type: String,
        required: true,
    },
    backIdPhotoUrl: {
        type: String,
        required: true,
    },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
