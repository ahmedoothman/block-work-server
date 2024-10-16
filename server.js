const mongoose = require('mongoose');
const { Types } = mongoose; // Importing Types for ObjectId casting
const dotenv = require('dotenv'); // to use environment variable
dotenv.config({ path: './config.env' }); // configuration of the environment file
const app = require('./app'); // import the express app
const { Server } = require('socket.io');
const User = require('./model/userModel'); // Assuming you have a User model
const Chat = require('./model/chatModel'); // The Chat schema you've provided
console.log(process.env.NODE_ENV);
process.on('uncaughtException', (err) => {
    console.log(err);
    console.log('Shuting down');
    process.exit(1);
});

// connect with the database, replacing the password in the link with the password we set from Atlas
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((con) => {
        console.log('DB Connected Successfully .....');
    });

const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`works on ${port} ...`);
});
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (you can specify this for production)
    },
});

// Socket.io connection for real-time chat and notifications
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', async ({ userId }) => {
        const userObjectId = Types.ObjectId(userId); // Casting userId to ObjectId
        await User.findByIdAndUpdate(userObjectId, { socketId: socket.id });
        console.log(`User ${userId} joined with socket ID ${socket.id}`);
    });

    // Handle chat messages
    socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
        try {
            const senderObjectId = Types.ObjectId(senderId); // Casting senderId to ObjectId
            const receiverObjectId = Types.ObjectId(receiverId); // Casting receiverId to ObjectId

            // Save the message in the database
            console.log('Message:', receiverObjectId, message);
            const newMessage = new Chat({
                from: senderObjectId,
                to: receiverObjectId,
                message: message,
            });
            await newMessage.save();

            // Fetch receiver's socket ID from the database
            const receiver = await User.findById(receiverObjectId);

            if (receiver && receiver.socketId) {
                // Emit the message to the receiver
                io.to(receiver.socketId).emit('receiveMessage', {
                    senderId,
                    message,
                    timestamp: newMessage.timestamp,
                    isRead: newMessage.isRead,
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        await User.findOneAndUpdate(
            { socketId: socket.id },
            { socketId: null }
        );
    });
});

process.on('unhandledRejection', (err) => {
    console.log(err);
    console.log('Shutting down');
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.log(err);
    console.log('Shutting down');
    server.close(() => {
        process.exit(1);
    });
});
