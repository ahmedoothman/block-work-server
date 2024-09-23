const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const storage = require('../utils/firebaseConfig'); // Import your Firebase storage config
const multer = require('multer');
const path = require('path');

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
    const { walletAddress } = req.body;

    // 1) Check if email and password exist
    if (!walletAddress) {
        return next(new AppError('Please provide walletAddress', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ walletAddress });
    if (!user) {
        return next(new AppError('User Not Found', 400));
    }
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.signup = [
    // Middleware to handle file uploads
    upload.fields([
        { name: 'frontIdPhoto', maxCount: 1 },
        { name: 'backIdPhoto', maxCount: 1 },
    ]),
    catchAsync(async (req, res, next) => {
        try {
            // Check if required files are provided
            if (!req.files.frontIdPhoto || !req.files.backIdPhoto) {
                return next(
                    new AppError(
                        'Both front and back ID photos are required.',
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

            // Upload the files to Firebase Storage
            const frontIdPhotoSnapshot = await uploadBytes(
                frontPhotoRef,
                req.files.frontIdPhoto[0].buffer
            );
            const backIdPhotoSnapshot = await uploadBytes(
                backPhotoRef,
                req.files.backIdPhoto[0].buffer
            );

            // Retrieve the URLs for the uploaded files
            const frontIdPhotoUrl = await getDownloadURL(
                frontIdPhotoSnapshot.ref
            );
            const backIdPhotoUrl = await getDownloadURL(
                backIdPhotoSnapshot.ref
            );

            // Create a new user record with the uploaded file URLs
            const newUser = await User.create({
                walletAddress: req.body.walletAddress,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                nationalId: req.body.nationalId,
                role: req.body.role,
                frontIdPhotoUrl, // Save the URL here
                backIdPhotoUrl, // Save the URL here
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
