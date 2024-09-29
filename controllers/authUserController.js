const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('../utils/email');
const AppError = require('./../utils/appError');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const storage = require('../utils/firebaseConfig'); // Import your Firebase storage config
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
});
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, //cookie cannot be modified or accessed by the browser to prevent scripting attack
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //when we use https
    res.cookie('jwt', token, cookieOptions);
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return next(new AppError('User Not Found', 400));
    }
    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.signup = [
    upload.fields([
        { name: 'frontIdPhoto', maxCount: 1 },
        { name: 'backIdPhoto', maxCount: 1 },
        { name: 'userPhoto', maxCount: 1 },
    ]),
    catchAsync(async (req, res, next) => {
        console.log(req.body);
        try {
            if (
                !req.files.frontIdPhoto ||
                !req.files.backIdPhoto ||
                !req.files.userPhoto
            ) {
                return next(
                    new AppError(
                        'Front ID photo, back ID photo, and user photo are required.',
                        400
                    )
                );
            }

            // Create references to the storage paths for uploaded files
            const frontPhotoRef = ref(
                storage,
                `users/${Date.now()}_frontIdPhoto${path.extname(
                    req.files.frontIdPhoto[0].originalname
                )}`
            );
            const backPhotoRef = ref(
                storage,
                `users/${Date.now()}_backIdPhoto${path.extname(
                    req.files.backIdPhoto[0].originalname
                )}`
            );
            const userPhotoRef = ref(
                storage,
                `users/${Date.now()}_userPhoto${path.extname(
                    req.files.userPhoto[0].originalname
                )}`
            );

            // Upload the files to Firebase Storage
            const frontIdPhotoSnapshot = await uploadBytes(
                frontPhotoRef,
                req.files.frontIdPhoto[0].buffer
            );
            const backIdPhotoSnapshot = await uploadBytes(
                backPhotoRef,
                req.files.backIdPhoto[0].buffer
            );
            const userPhotoSnapshot = await uploadBytes(
                userPhotoRef,
                req.files.userPhoto[0].buffer
            );

            // Retrieve the URLs for the uploaded files
            const frontIdPhotoUrl = await getDownloadURL(
                frontIdPhotoSnapshot.ref
            );
            const backIdPhotoUrl = await getDownloadURL(
                backIdPhotoSnapshot.ref
            );
            const userPhotoUrl = await getDownloadURL(userPhotoSnapshot.ref);

            // Create a new user record with the uploaded file URLs
            const newUser = await User.create({
                walletAddress: req.body.walletAddress,
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                passwordConfirm: req.body.passwordConfirm,
                phone: req.body.phone,
                nationalId: req.body.nationalId,
                role: req.body.role,
                country: req.body.country,
                frontIdPhotoUrl, // Save the URL here
                backIdPhotoUrl, // Save the URL here
                userPhotoUrl, // Save the user photo URL here
            });

            req.body.userId = newUser._id;
            req.user = newUser;
            next();
        } catch (err) {
            console.log(err);
            return next(new AppError('Error uploading files', 500));
        }
    }),
];

exports.protect = catchAsync(async (req, res, next) => {
    //1) get Token
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please log in to get access.',
                401
            )
        );
    }

    //2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token no longer exists.',
                401
            )
        );
    }

    // Grant Access
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1) get user
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        return next(new AppError('There is no user with that id.', 404));
    }

    //2 check  current password
    const correctPass = await user.correctPassword(
        req.body.passwordCurrent,
        user.password
    );
    if (!correctPass) {
        return next(new AppError('Current password is not correct', 401));
    }
    //3 update user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4 log user in
    createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) get user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('there is no user with that email', 404));
    }
    //2) Generate random reset Code
    const resetCode = await user.createPasswordResetCode();
    await user.save({ validateBeforeSave: false });

    //3)send it to user email

    try {
        new sendEmail(
            { email: user.email, name: user.name },
            resetCode
        ).sendResetPassword();

        res.status(200).json({
            status: 'success',
            message: 'code sent to email',
        });
    } catch (err) {
        user.PasswordResetCode = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'there was an error sending the email. try again later!'
            ),
            500
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) hash code and get user
    const hashedCode = crypto
        .createHash('sha256')
        .update(req.params.code)
        .digest('hex');

    const user = await User.findOne({
        passwordResetCode: hashedCode,
        passwordResetExpires: { $gt: Date.now() },
    });

    //2) check if user exists or code has expired
    if (!user) {
        return next(new AppError('code is expired or invalid', 400));
    }
    //console.log(req.body.password);
    //3) update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //4)log user in
    createSendToken(user, 200, res);
});
