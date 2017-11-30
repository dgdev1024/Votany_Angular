///
/// @file   index.js
/// @brief  The entry point for our application.
///

// Imports
const mongoose  = require('mongoose');
const env       = require('node-env-file');

// Mongoose Promise
mongoose.Promise = global.Promise;

// Environment Variables - Development Only
if (process.env.NODE_ENV === 'development') {
    env('.env');
}

// Connect to Database
console.log('Connecting to Database. . .');
mongoose.connect(process.env.DATABASE_URL, { useMongoClient: true })
    .then(require('./srv'))
    .catch((err) => {
        // Report error, close database, and exit.
        console.error(`[EXCEPTION!] ${err.stack ? err.stack : err}`);
        mongoose.connection.close().then(() => process.exit(1));
    });