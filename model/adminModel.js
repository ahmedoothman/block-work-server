const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminModel = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name '],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'User must have a email '],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email'],
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'please Provide a password'],
        minlength: 8,
        select: false, //not shown in response
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'passwords are not the same',
        },
        //select:false
    },
    accountCreatedAt: {
        type: Date,
        required: [false],
        default: new Date(),
    },
});

//hash password when creating or updating user we know that because the password is modified
adminModel.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm = undefined;
        next();
    } else {
        return next();
    }
});

//add the date of the cahnged password
adminModel.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

adminModel.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

//methods to the schema we need

adminModel.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model('Admin', adminModel);
module.exports = Admin;
