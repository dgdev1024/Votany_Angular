///
/// @file   index.js
/// @brief  The entry point for our application's backend.
///

// Imports
const http          = require('http');
const path          = require('path');
const express       = require('express');
const session       = require('express-session');
const bodyParser    = require('body-parser');
const helmet        = require('helmet');
const cors          = require('cors');
const compression   = require('compression');
const passport      = require('passport');
const socketIo      = require('socket.io');
const httpStatus    = require('http-status-codes');

// Export Main Function
module.exports = () => {
    // Express and Middleware
    const app = express();
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // We are using JSON web token authentication for this project, in lieu of sessions.
    // However, we need to implement session support in order for Passport's social media
    // login strategies to work.
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());

    // Socket.IO
    const server = http.createServer(app);
    const io = socketIo(server);

    // API Routing
    app.use('/api/user', require('./routes/auth')(io));
    app.use('/api/poll', require('./routes/poll')(io));

    // Index Routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });

    // Error Handling
    if (process.env.NODE_ENV === 'development') {
        app.use((err, req, res, next) => {
            console.error(`Caught Error: ${err}`);

            const code = err.status || 500;

            return res.status(code).json({
                error: {
                    status: code,
                    type: httpStatus.getStatusText(code),
                    message: err.message,
                    stack: err.stack
                }
            });
        });
    } else {
        app.use((err, req, res, next) => {
            console.error(`Caught Error: ${err}`);

            const code = err.status || 500;

            return res.status(code).json({
                error: {
                    status: code,
                    message: httpStatus.getStatusText(code)
                }
            });
        });
    }

    // Listen
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Server listening on port #${server.address().port}. . .`);
    });
};