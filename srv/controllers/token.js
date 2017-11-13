///
/// @file   token.js
/// @brief  Controller functions for our password reset tokens.
///

// Imports
const waterfall     = require('async').waterfall;
const userModel     = require('../models/user');
const tokenModel    = require('../models/token');
const validate      = require('../utility/validate');
const email         = require('../utility/email');

// Export Controller Functions
module.exports = {
    ///
    /// @fn     issueToken
    /// @brief  Issues the user a new password reset token.
    ///
    /// @param {string} emailAddress The user's email address.
    /// @param {function} done Run when finished.
    ///
    issueToken (emailAddress, done) {
        const functions = [
            // Find the user with this email address.
            (next) => {
                userModel.findOne({ loginMethod: 'local', emailAddress })
                    .then((user) => {
                        if (!user || user.verified === false) {
                            return next({
                                status: 404,
                                message: 'A verified local user with this email address was not found.'
                            });
                        }

                        return next(null, user);
                    })
                    .catch((err) => {
                        console.error(`tokenController.issueToken (find user) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while searching the user database. Try again later.'
                        });
                    });
            },

            // Make sure there is no token already with this email address.
            (user, next) => {
                tokenModel.findOne({ emailAddress })
                    .then((token) => {
                        if (token) {
                            return next({
                                status: 409,
                                message: 'A password reset token was already recently issued. Try again later.'
                            });
                        }

                        return next(null, user);
                    })
                    .catch((err) => {
                        console.error(`tokenController.issueToken (find token) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while searching the tokens database. Try again later.'
                        });
                    });
            },

            // Create the token and save it in the database.
            (user, next) => {
                let newToken = new tokenModel();
                newToken.emailAddress = emailAddress;
                const code = newToken.generate();

                newToken.save()
                    .then((token) => {
                        return next(null, user, token, code);
                    })
                    .catch((err) => {
                        console.error(`tokenController.issueToken (create token) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while creating the password token. Try again later.'
                        });
                    });
            },

            // Send the user an email letting them know the token was issued.
            (user, token, code, next) => {
                email.passwordTokenIssued({
                    emailAddress,
                    displayName: user.name,
                    authenticateId: token.authenticateId,
                    authenticateCode: code
                }, (err) => {
                    if (err) {
                        console.error(`tokenController.issueToken (send email) - ${err.stack}`);
                        token.remove();
                        return next({
                            status: 500,
                            message: 'Something went wrong while sending you the token\'s authentication code. Try again later.'
                        });
                    }

                    return next(null);
                });
            }
        ];

        waterfall(functions, (err) => {
            if (err) { return done(err); }
            return done(null, {
                message: 'Check your inbox for the password token\'s authentication code.'
            });
        });
    },

    ///
    /// @fn     authenticateToken
    /// @brief  Attempts to authenticate a password reset token.
    ///
    /// @param {string} id The identifying portion of the authentication URL.
    /// @param {string} code The authentication code submitted by the user.
    /// @param {function} done Run when finished.
    ///
    authenticateToken (id, code, done) {
        const functions = [
            // Find the password token in the database.
            (next) => {
                tokenModel.findOne({ authenticateId: id })
                    .then((token) => {
                        // Was the token found?
                        if (!token) {
                            return next({
                                status: 404,
                                message: 'Password token not found.'
                            });
                        }

                        // Has the token been authenticated already?
                        if (token.authenticated === true) {
                            return next({
                                status: 409,
                                message: 'This password token has already been authenticated.'
                            });
                        }

                        // Check the authentication code submitted against the hashed code stored.
                        if (token.check(code) === false) {
                            return next({
                                status: 401,
                                message: 'The authentication code you submitted is incorrect.'
                            });
                        }

                        // Next function.
                        return next(null, token);
                    })
                    .catch((err) => {
                        console.error(`tokenController.authenticateToken (auth token) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while authenticating your password token. Try again later.',
                            details: [
                                'If this problem persists, you may need to submit a new password reset request.'
                            ]
                        });
                    });
            },

            // Mark the token as authenticated.
            (token, next) => {
                token.authenticated = true;
                token.save()
                    .then(() => {
                        return next(null);
                    })
                    .catch((err) => {
                        console.error(`tokenController.authenticateToken (mark token) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while marking your authentication token. Try again later.',
                            details: [
                                'If this problem persists, you may need to submit a new password reset request.'
                            ]
                        });
                    });
            }
        ];

        waterfall(functions, (err) => {
            if (err) { return done(err); }
            return done(null, {
                message: 'Your password request has been authenticated. You may now change your password.'
            });
        })
    },

    ///
    /// @fn     changePassword
    /// @brief  Spends a password reset token to change the user's password.
    ///
    /// Details:
    ///     id, password, confirm
    ///
    changePassword (details, done) {
        // Our waterfall functions.
        const functions = [
            // Validate the password input by the user.
            (next) => {
                // Check for any errors in the submitted password.
                const error = validate.password(details.password, details.confirm);
                if (error) {
                    return next({
                        status: 400,
                        message: error
                    });
                }

                // Next
                return next(null);
            },

            // Look for the password token associated with the ID given. The token
            // must be authenticated, but not spent.
            (next) => {
                tokenModel.findOne({ authenticateId: details.id })
                    .then((token) => {
                        // Did we find an authenticated, unspent token?
                        if (!token || token.authenticated === false || token.spent === true) {
                            return next({
                                status: 404,
                                message: 'The password token ID given is not valid.'
                            });
                        }

                        // Send the token to the next function.
                        return next(null, token);
                    })
                    .catch((err) => {
                        console.error(`tokenController.changePassword (find token) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while finding your password token. Try again later.',
                            details: [
                                'If this problem persists, you may need to submit a new password reset request.'
                            ]
                        });
                    });
            },

            // Find the user with the email address on the token in our database.
            (token, next) => {
                userModel.findOne({ loginMethod: 'local', emailAddress: token.emailAddress })
                    .then((user) => {
                        if (!user || user.verified === false) {
                            token.remove();
                            return next({
                                status: 404,
                                message: 'A verified local user with this token\'s email address was not found.'
                            });
                        }

                        return next(null, token, user);
                    })
                    .catch((err) => {
                        console.error(`tokenController.changePassword (find user) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while finding the token\'s matching user. Try again later.',
                            details: [
                                'If this problem persists, you may need to submit a new password reset request.'
                            ]
                        });
                    });
            },

            // Change the user's password.
            (token, user, next) => {
                user.setPassword(details.password);
                user.save()
                    .then(() => {
                        return next(null, user, token);
                    })
                    .catch((err) => {
                        console.error(`tokenController.changePassword (change password) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while changing your password. Try again later.',
                            details: [
                                'If this problem persists, you may need to submit a new password reset request.'
                            ]
                        });
                    });
            },

            // Mark the token as spent.
            (user, token, next) => {
                token.spent = true;
                token.save()
                    .then(() => {
                        return next(null, user);
                    })
                    .catch((err) => {
                        console.warn(`tokenController.changePassword (spend token) - ${err.stack}`);
                        token.remove();

                        // An error in this case is not fatal. Move on to the next function anyway.
                        return next(null, user);
                    });
            },

            // Send the user an email letting them know that their password has been changed.
            (user, next) => {
                email.passwordChanged({
                    emailAddress: user.emailAddress,
                    displayName: user.name
                }, (err) => {
                    if (err) {
                        console.warn(`tokenController.changePassword (send email) - ${err.stack}`);
                    }

                    return next(null);
                });
            }
        ];

        waterfall(functions, (err) => {
            if (err) { return done(err); }
            return done(null, {
                message: 'Your password has been changed!'
            });
        });
    }
};