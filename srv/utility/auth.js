///
/// @file   auth.js
/// @brief  Functions for authenticating and testing for authentication.
///

// Imports
const passport          = require('passport');
const passportLocal     = require('passport-local');
const passportFacebook  = require('passport-facebook');
const passportTwitter   = require('passport-twitter');
const expressJwt        = require('express-jwt');
const userModel         = require('../models/user');

// Exports
module.exports = {
    // Router middleware for checking JSON web tokens.
    checkJwt: expressJwt({
        secret: process.env.JWT_SECRET,
        userProperty: 'payload',
        credentialsRequired: false
    }),

    ///
    /// @fn     testLogin
    /// @brief  Searches for a user matching an ID found in a JSON web token.
    ///
    /// @param {object} request The HTTP request object.
    /// @param {function} done Run when finished.
    ///
    testLogin (request, done) {
        // Check to see if a JWT payload is present in the request. If so, then
        // make sure a valid user ID is present within.
        if (!request.payload || !request.payload._id) {
            return done({
                status: 401,
                message: 'You are not logged in.'
            });
        }

        // Check to see if the JWT payload is still live.
        if (request.payload.exp <= Date.now() / 1000) {
            return done({
                status: 401,
                message: 'Your login token has expired. Please log in again'
            });
        }

        // Search the user database for a user with the ID found.
        userModel.findById(request.payload._id)
            .then((user) => {
                // If no verified user account was found, then the token is invalid.
                if (!user || user.verified === false) {
                    return done({
                        status: 401,
                        message: 'Your login token is not valid. Please log in.'
                    });
                }

                return done(null, {
                    id: request.payload._id,
                    name: request.payload.name
                });
            }).catch((err) => {
                console.error(`auth.testLogin (find user) - ${err.stack}`);

                return done({
                    status: 500,
                    message: 'Something went wrong while verifying your login status. Try again later'
                });
            });
    },

    // Passport Login Strategies
    strategies: {
        // Strategy for logging in with the local strategy (the traditional
        // email/password approach).
        local: new passportLocal.Strategy({
            usernameField: 'emailAddress'
        }, (email, password, done) => {
            // Find a verified, local user with this email address in our database.
            userModel.findOne({ loginMethod: 'local', emailAddress: email })
                .then((user) => {
                    if (!user || user.verified === false) {
                        return done(null, false, { 
                            message: 'A verified local user with this email address was not found.'
                        });
                    }

                    if (user.checkPassword(password) === 'WRONG') {
                        return done(null, false, {
                            message: 'The password submitted is incorrect.'
                        });
                    }

                    return done(null, user);
                })
                .catch((err) => {
                    console.error(`auth.strategies.local (find user) - ${err}`);
                    return done(err);
                });
        }),

        // Strategy for logging a user in via Twitter.
        twitter: new passportTwitter.Strategy({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: `${process.env.SITE_URL}/api/user/login/twitter/callback`
        }, (accessToken, refreshToken, profile, done) => {
            // Fetch the provider ID and display name.
            const { id, displayName } = profile;

            // Find a user in the database that matches what we turned up.
            userModel.findOne({ loginMethod: 'twitter', providerId: id })
                .then((user) => {
                    // If the user was not found in our database, then create it.
                    if (!user) {
                        // Create the user object.
                        let newUser = new userModel();
                        newUser.loginMethod = 'twitter';
                        newUser.providerId = id;
                        newUser.displayName = displayName;

                        // Because we are logging in with a social media account, account verification
                        // will not be necessary in this case.
                        newUser.verified = true;
                        newUser.verifyUrl = null;
                        newUser.verifyExpiry = null;

                        // Save the user in the database.
                        newUser.save()
                            .then((user) => {
                                return done(null, user);
                            })
                            .catch((err) => {
                                console.error(`auth.strategies.twitter (save user) - ${err}`);
                                return done(err);
                            });
                    } else {
                        return done(null, user);
                    }
                })
                .catch((err) => {
                    console.error(`auth.strategies.twitter (find user) - ${err}`);
                    return done(err);
                });
        }),

        // Strategy for logging a user in via Facebook.
        facebook: new passportFacebook.Strategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: `${process.env.SITE_URL}/api/user/login/facebook/callback`
        }, (accessToken, refreshToken, profile, done) => {
            // Fetch the provider ID and display name.
            const { id, displayName } = profile;

            // Find a user in the database that matches what we turned up.
            userModel.findOne({ loginMethod: 'facebook', providerId: id })
                .then((user) => {
                    // If the user was not found in our database, then create it.
                    if (!user) {
                        // Create the user object.
                        let newUser = new userModel();
                        newUser.loginMethod = 'facebook';
                        newUser.providerId = id;
                        newUser.displayName = displayName;

                        // Because we are logging in with a social media account, account verification
                        // will not be necessary in this case.
                        newUser.verified = true;
                        newUser.verifyUrl = null;
                        newUser.verifyExpiry = null;

                        // Save the user in the database.
                        newUser.save()
                            .then((user) => {
                                return done(null, user);
                            })
                            .catch((err) => {
                                console.error(`auth.strategies.facebook (save user) - ${err}`);
                                return done(err);
                            });
                    } else {
                        return done(null, user);
                    }
                })
                .catch((err) => {
                    console.error(`auth.strategies.facebook (find user) - ${err}`);
                    return done(err);
                });
        })
    }
}