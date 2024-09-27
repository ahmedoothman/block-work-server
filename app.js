const express = require('express'); // import express
const path = require('path');
const morgan = require('morgan'); // 3rd party middleware
////////////////////////////////////////////////////////
const adminRouter = require('./routes/adminRoutes');
const userRouter = require('./routes/userRoutes');
const walletRouter = require('./routes/walletRoutes');
const portfolioRouter = require('./routes/portfolioRoutes');
const jobPostRoutes = require('./routes/jobPostRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const chatRoutes = require('./routes/chatRoutes');
const contractRoutes = require('./routes/contractRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorController = require('./controllers/errorController');

//secuirty
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError.js');
const app = express(); // creating express app

//multiple request attack
const limiter = rateLimit({
    max: 200,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests drom this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // we need that middleware for convert the url we got to json (not sure)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); //Data sensitization against no SQL query injection
app.use(xss()); //Data sensitization against XSS
app.use(cors()); // enable cors for all routes
app.use(
    hpp({
        whitelist: [],
    })
);
//routes

app.use('/api/admins', adminRouter);
app.use('/api/users', userRouter);
app.use('/api/wallets', walletRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/jobPosts', jobPostRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reviews', reviewRoutes);
//unhandeled routes gets response with this , must be put at the end of the file after all routes
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server`
    // });
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // node js understand that , when we pass a parameter to next() it means that is an error and will skip all middlewares and send it to the global error handling middleware
});

app.use(errorController);
module.exports = app; // we export it to the server file where we will include it there
