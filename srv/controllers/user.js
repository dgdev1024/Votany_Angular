///
/// @file   user.js
/// @brief  Controller functions for the user database object.
///

// Imports
const waterfall     = require('async').waterfall;
const forEachOf     = require('async').forEachOf;
const userModel     = require('../models/user');
const pollModel     = require('../models/poll').pollModel;
const validate      = require('../utility/validate');
const email         = require('../utility/email');

// Export Controller Functions
module.exports = {
    ///
    /// @fn     registerLocalUser
    /// @brief  Registers a user for login using the local strategy.
    ///
    /// Details:
    ///     firstName, lastName, emailAddress, password, confirm
    ///
    /// @param {object} details The details object.
    /// @param {function} done Run when finished.
    ///
    registerLocalUser (details, done) {
        // The sequence of functions to be run.
        const functions = [
            // First, make sure the credentials the new user submitted are valid.
            (next) => {
                // Validate our credentials. Record any errors.
                const nameError  = validate.fullName(details.firstName, details.lastName);
                const emailError = validate.emailAddress(details.emailAddress);
                const passError  = validate.password(details.password, details.confirm);

                // Store any errors in an array.
                let errors = [];
                if (nameError)  { errors.push(nameError);  }
                if (emailError) { errors.push(emailError); }
                if (passError)  { errors.push(passError);  }

                // If any errors were caught, early out.
                if (errors.length > 0) {
                    return next({
                        status: 400,
                        message: 'Your registration credentials could not be validated.',
                        details: errors
                    });
                }

                // Next.
                return next(null);
            },

            // Check the database. Make sure a local user isn't already using the submitted
            // email address.
            (next) => {
                userModel.findOne({ loginMethod: 'local', emailAddress: details.emailAddress })
                    .then((user) => {
                        // If the user was found in the database, then early out.
                        if (user) {
                            return next({
                                status: 409,
                                message: 'The email address submitted is already being used. Try another one.'
                            });
                        }

                        // Next.
                        return next(null);
                    })
                    .catch((err) => {
                        console.error(`userController.registerLocalUser (find user) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while checking the user database. Try again later.'
                        });
                    });
            },

            // Create the new user and store it in our database.
            (next) => {
                let newUser = new userModel();
                newUser.loginMethod = 'local';
                newUser.firstName = details.firstName;
                newUser.lastName = details.lastName;
                newUser.emailAddress = details.emailAddress;
                newUser.setPassword(details.password);
                newUser.generateVerifyUrl();

                newUser.save()
                    .then((user) => {
                        return next(null, user);
                    })
                    .catch((err) => {
                        console.error(`userController.registerLocalUser (save user) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while saving the new user. Try again later.'
                        });
                    });
            },

            // Send the new user an email asking them to verify their account.
            (user, next) => {
                email.localUserVerification({
                    emailAddress: user.emailAddress,
                    displayName: user.name,
                    verifyUrl: user.verifyUrl
                }, (err) => {
                    if (err) {
                        console.error(`userController.registerLocalUser (send email) - ${err.stack}`);
                        user.remove();
                        return next({
                            status: 500,
                            message: 'Something went wrong while sending the verification email. Try again later.'
                        });
                    }

                    return next(null, {
                        message: 'Check your inbox for your account verification email.'
                    });
                });
            }
        ];

        waterfall(functions, (err, ok) => {
            if (err) { return done(err); }
            return done(null, ok);
        });
    },

    ///
    /// @fn     verifyLocalUser
    /// @brief  Verifies the newly-created account of a user logging in locally.
    ///
    /// @param {string} id The identifying portion of the verification URL.
    /// @param {function} done Run when finished.
    ///
    verifyLocalUser (id, done) {
        // Find the un-verified local user with the given verification URL.
        userModel.findOneAndUpdate({
            loginMethod: 'local',
            verifyUrl: id
        }, {
            verified: true,
            verifyUrl: null,
            verifyExpiry: null
        }, {
            new: true
        }).then((user) => {
            if (!user) {
                return done({
                    status: 404,
                    message: 'An un-verified user with this verification URL was not found'
                });
            }

            return done(null, {
                message: 'Your new account is now verified. You may now log in.'
            });
        }).catch((err) => {
            console.error(`userController.verifyLocalUser (update user) - ${err.stack}`);
            return done({
                status: 500,
                message: 'Something went wrong while verifying your new account. Try again later.',
                details: [
                    'If this error persists, you may need to re-register your account.'
                ]
            });
        });
    },

    ///
    /// @fn     fetchUserProfile
    /// @brief  Fetches a profile of the user with the given ID.
    ///
    /// @param  {string}    id The user ID.
    /// @param  {function}  done Run when finished.
    ///
    fetchUserProfile (id, done) {
        waterfall(
            [
                // Find the user in the database.
                (next) => {
                    userModel.findById(id).then((user) => {
                        if (!user) {
                            return next({ status: 404, message: 'User not found.' });
                        }

                        return next(null, {
                            id: user._id.toString(),
                            name: user.name,
                            loginMethod: user.loginMethod,
                            joinDate: user.joinDate
                        });
                    }).catch((err) => {
                        console.error(`userController.fetchUserProfile (find user) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while fetching the user profile. Try again later.' });
                    });
                }
            ],
            (err, profile) => {
                if (err) { return done(err); }
                return done(null, profile);
            }
        );
    },

    ///
    /// @fn     deleteUser
    /// @brief  Deletes a user from the site.
    ///
    /// @param  {string} id     The ID of the user to be removed.
    /// @param  {function} done Run when finished.
    ///
    deleteUser (id, done) {
        waterfall([
            // First, find and remove all polls authored by this account.
            (next) => {
                pollModel.remove({ authorId: id })
                    .then(() => {
                        return next(null);
                    })
                    .catch((err) => {
                        console.error(`userController.deleteUser (delete polls) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while deleting your account. Try again later.' });
                    })
            },

            // Next, find and remove all comments authored by this account.
            (next) => {
                pollModel.find({}).then((polls) => {
                    forEachOf(polls, (val, key, fornext) => {
                        if (val.comments.length === 0) {
                            return fornext();
                        }

                        val.comments = val.comments.filter((comment) => {
                            return comment.authorId !== id;
                        });

                        val.save().then(() => { 
                            return fornext(); 
                        }).catch((err) => {
                            console.warn(`userController.deleteUser (delete comment) - ${err.stack}`);
                            return fornext();
                        });
                    }, (err) => {
                        if (err) { return next(err); }
                        return next(null);
                    });
                }).catch((err) => {
                    console.error(`userController.deleteUser (delete comments) - ${err.stack}`);
                    return next({ status: 500, message: 'Something went wrong while deleting your account. Try again later.' });
                });
            },

            // Now remove this account from the database.
            (next) => {
                userModel.findByIdAndRemove(id).then(() => {
                    return next(null);
                }).catch((err) => {
                    console.error(`userController.deleteUser (delete account) - ${err.stack}`);
                    return next({ status: 500, message: 'Something went wrong while deleting your account. Try again later.' });
                });
            }
        ], (err) => {
            if (err) { return done(err); }
            return done(null, { message: 'Your account has been deleted.' });
        })
    }
};