///
/// @file   poll.js
/// @brief  Controller functions for the poll database model.
///

// Imports
const waterfall         = require('async').waterfall;
const userModel         = require('../models/user');
const pollModel         = require('../models/poll').pollModel;
const commentModel      = require('../models/poll').commentModel;

// Export Controller Functions
module.exports = {
    ///
    /// @fn     createPoll
    /// @brief  Creates a new poll.
    ///
    /// Details:
    ///     userId, userName, issue, choices, requiresLogin, canAddExtraChoices,
    ///     pollWillClose, closeDate, keywords
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    createPoll (details, socket, done) {
        waterfall(
            [
                // First, validate the poll credentials we were given.
                (next) => {
                    // Track validation errors.
                    let errors = [];

                    // Check to see if the user entered an issue.
                    if (!details.issue) {
                        errors.push('Please enter an issue.');
                    }

                    // The poll issue must contain 280 characters or fewer.
                    else if (details.issue.length > 280) {
                        errors.push('The poll issue must contain 280 characters or fewer.');
                    }

                    // The poll must contain at least two choices.
                    if (details.choices.length < 2) {
                        errors.push('The poll must contain at least two choices.');
                    }

                    // Each poll choice must contain 140 characters or fewer.
                    for (const choice of details.choices) {
                        if (choice.length > 140) {
                            errors.push('One or more of your poll choices have more than 140 characters.');
                            break;
                        }
                    }

                    // If the poll is set to close, make sure the close date is actually a point in
                    // the future.
                    const closeDate = details.pollWillClose ? new Date(details.closeDate) : new Date();
                    if (details.pollWillClose && Date.now() >= closeDate.getTime()) {
                        errors.push('The poll\'s close date needs to be a point in the future.');
                    }

                    // Make sure the user added at least one keyword to the poll.
                    if (!details.keywords || details.keywords.length === 0) {
                        errors.push('Polls must have at least one keyword.');
                    }

                    // Check to see if any validation errors were raised.
                    if (errors.length > 0) {
                        return next({
                            status: 400,
                            message: 'There were validation errors in the poll you submitted.',
                            details: errors
                        });
                    }

                    // Next function.
                    return next(null, closeDate);
                },

                // Create and save the poll.
                (closeDate, next) => {
                    // Create and populate the poll object.
                    let p = new pollModel();
                    p.authorId = details.userId;
                    p.issue = details.issue;
                    p.choices = details.choices.map(c => { return { body: c, voters: [] }; });
                    p.requiresLogin = details.requiresLogin;
                    p.canAddExtraChoices = details.canAddExtraChoices;
                    p.pollWillClose = details.pollWillClose;
                    p.closeDate = (details.pollWillClose ? closeDate : null);
                    p.searchKeywords = details.keywords;

                    // Save the poll to the database.
                    p.save().then((poll) => {
                        // Broadcast a message to our clients letting them know about the new poll.
                        socket.emit('new poll', {
                            pollId: poll._id.toString(),
                            authorId: poll.authorId,
                            authorName: details.userName,
                            issue: poll.issue,
                            postDate: poll.postDate,
                            searchKeywords: poll.searchKeywords
                        });

                        // Done.
                        return next(null, poll._id.toString());
                    }).catch((err) => {
                        console.error(`pollController.createPoll (save poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while creating your poll. Try again later.' });
                    });
                }
            ],
            (err, id) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your poll has been posted!',
                    pollId: id
                });
            }
        );
    },

    ///
    /// @fn     postComment
    /// @brief  Posts a comment on the given poll.
    ///
    /// Details:
    ///     userId, userName, pollId, body
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    postComment (details, socket, done) {
        // Drip, drip, drip...
        waterfall(
            [
                // Validate the comment.
                (next) => {
                    if (!details.body) {
                        return next({ status: 400, message: 'Please enter a comment.' });
                    }

                    if (details.body.length > 280) {
                        return next({ status: 400, message: 'Your comment contains too many characters.' });
                    }

                    return next(null);
                },

                // Check to see if a poll with the given ID exists.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with the given ID was not found.' });
                        }

                        // Send the poll to the next function.
                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.postComment (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while fetching the poll. Try again later.' });
                    });
                },

                // Validate the submitted comment.
                (poll, next) => {
                    if (details.body > 140) {
                        return next({ status: 400, message: 'Your comment must be 140 characters or fewer.' });
                    }

                    return next(null, poll);
                },

                // Add the comment to the poll and save it.
                (poll, next) => {
                    poll.comments.push({ authorId: details.userId, body: details.body });
                    poll.lastInteractionDate = new Date();
                    poll.save(() => {
                        // Broadcast the new comment to our clients.
                        socket.emit('post comment', {
                            pollId: details.pollId,
                            authorId: details.userId,
                            commentId: poll.comments[poll.comments.length - 1]._id.toString(),
                            authorName: details.userName,
                            body: details.body,
                            postDate: new Date(poll.lastInteractionDate)
                        });

                        // Done.
                        return next(null);
                    }).catch((err) => {
                        console.error(`pollController.postComment (save comment) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while saving your comment. Try again later.' });
                    })
                }
            ],
            (err) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your comment has been posted!'
                });
            }
        );
    },

    ///
    /// @fn     fetchPoll
    /// @brief  Fetches the poll with the given database ID.
    ///
    /// @param  {string}    pollId The ID of the poll.
    /// @param  {string}    voterId The ID (or IP address) of the viewing voter.
    /// @param  {function}  done Run when finished.
    ///
    fetchPoll (pollId, voterId, done) {
        pollModel.findById(pollId).populate('authorId').exec().then((poll) => {
            if (!poll) {
                return done({ status: 404, message: 'A poll with this ID was not found.' });
            }

            const choiceVotedFor = poll.votedFor(voterId);

            return done(null, {
                pollUrl: `${process.env.SITE_URL}/poll/view/${pollId}`,
                authorId: poll.authorId._id,
                authorName: poll.authorId.name,
                postDate: poll.postDate,
                issue: poll.issue,
                choices: poll.choices.map((choice) => { return { choiceId: choice._id, body: choice.body, votes: choice.voters.length }; }),
                choiceVotedFor,
                requiresLogin: poll.requiresLogin,
                canAddExtraChoices: poll.canAddExtraChoices,
                pollWillClose: poll.pollWillClose,
                closeDate: poll.pollWillClose ? poll.closeDate : null,
                closed: poll.closed,
                searchKeywords: poll.searchKeywords,
                edited: poll.edited,
                editCount: poll.editCount,
                isAuthor: poll.authorId._id.toString() === voterId,
                hasVoted: choiceVotedFor !== null
            });
        }).catch((err) => {
            console.error(`pollController.fetchPoll (fetch poll) - ${err.stack}`);
            return done({ status: 500, message: 'Something went wrong while fetching your poll. Try again later.' });
        });
    },

    ///
    /// @fn     fetchPollComments
    /// @brief  Fetches a batch of comments on a poll.
    ///
    /// @param  {string}    pollId The ID of the poll to fetch comments on.
    /// @param  {number}    page The current page of comments.
    /// @param  {function}  done Run when finished.
    ///
    fetchPollComments (pollId, page, done) {
        pollModel.findById(pollId).then((poll) => {
            if (!poll) {
                return done({ status: 404, message: 'A poll with this ID was not found.' });
            }

            if (poll.comments.length === 0) {
                return done(null, { comments: [], lastPage: true });
            }

            // Populate the author IDs of the poll's comments with the authors' details.
            commentModel.populate(poll.comments, { path: 'authorId' }).then((comments) => {
                // Get the start-to-end range of the comments to be returned.
                const start = 0 + (10 * page);
                const end = start + 10 + 1;

                // Slice our comments per page, sort by post date, and map them for return.
                const sliced = poll.comments.sort((a, b) => {
                    return b.postDate.getTime() - a.postDate.getTime();
                }).slice(start, end).map((comment) => {
                    return {
                        commentId: comment._id.toString(),
                        authorId: comment.authorId._id,
                        authorName: comment.authorId.name,
                        postDate: comment.postDate,
                        body: comment.body
                    };
                });

                // Return our comments.
                return done(null, {
                    comments: sliced.slice(0, 10),
                    lastPage: sliced.length < 11
                });
            }).catch((err) => {
                console.error(`pollController.fetchPollComments (populate comment author IDs) - ${err.stack}`);
                return done({ status: 500, message: 'Something went wrong while fetching your comments. Try again later.' });
            });
        }).catch((err) => {
            console.error(`pollController.fetchPollComments (fetch poll) - ${err.stack}`);
            return done({ status: 500, message: 'Something went wrong while fetching your poll. Try again later.' });
        });
    },

    ///
    /// @fn     searchForPolls
    /// @brief  Fetches polls based on a keyword search.
    ///
    /// @param  {string}    keywords The keywords to search by.
    /// @param  {number}    page The search's current page.
    /// @param  {function}  done Run when finished.
    ///
    searchForPolls (keywords, page, done) {
        // Find all matching polls, sorted by relevance based on their issue question
        // and search keywords.
        pollModel.find(
            { $text: { $search: keywords }},
            { score: { $meta: 'textScore' }}
        )
            .sort({ score: { $meta: 'textScore' }})
            .skip(20 * page)
            .limit(21)
            .populate('authorId')
            .exec()
            .then((polls) => {
                // Were any polls found?
                if (polls.length === 0) {
                    return done({ 
                        status: 404, 
                        message: 'Your search did not yield any results.',
                        details: page > 0 ? [ 'Try searching again in a lower page.' ] : null
                    });
                }

                return done(null, {
                    polls: polls.slice(0, 20).map(poll => {
                        return {
                            pollId: poll._id.toString(),
                            issue: poll.issue,
                            authorId: poll.authorId._id,
                            authorName: poll.authorId.name,
                            postDate: poll.postDate,
                            voteCount: poll.voteCount,
                            commentCount: poll.commentCount,
                            editCount: poll.editCount,
                            closed: poll.closed,
                        };
                    }),
                    lastPage: polls.length < 21
                });
            })
            .catch((err) => {
                console.log(`pollController.searchForPolls (search polls) - ${err.stack}`);
                return done({ status: 500, message: 'Something went wrong while searching for polls. Try again later.' });
            });
    },

    ///
    /// @fn     fetchPollsByUser
    /// @brief  Fetches all polls posted by a user with the given ID.
    ///
    /// @param  {string}    userId The user ID to search by.
    /// @param  {number}    page The page of polls.
    /// @param  {function}  done Run when finished.
    ///
    fetchPollsByUser (userId, page, done) {
        pollModel.find({ authorId: userId })
            .populate('authorId')
            .sort('-postDate')
            .limit(21)
            .skip(20 * page)
            .exec()
            .then((polls) => {
                if (polls.length === 0) {
                    return done({ status: 404, message: 'This user has not posted any polls.' });
                }
                
                return done(null, {
                    polls: polls.slice(0, 20).map(poll => {
                        return {
                            pollId: poll._id.toString(),
                            issue: poll.issue,
                            authorId: poll.authorId._id,
                            authorName: poll.authorId.name,
                            postDate: poll.postDate,
                            voteCount: poll.voteCount,
                            commentCount: poll.commentCount,
                            editCount: poll.editCount,
                            closed: poll.closed,
                        };
                    }),
                    lastPage: polls.length < 21
                });
            })
            .catch((err) => {
                console.error(`pollController.fetchPollsByUser (find polls) - ${err.stack}`);
                return done({ status: 500, message: 'Something went wrong while searching for polls. Try again later.' });
            });
    },

    ///
    /// @fn     fetchHotPolls
    /// @brief  Fetches the polls with the most heat as of right now.
    ///
    /// @param  {number}    page The current page to search.
    /// @param  {function}  done Run when finished.
    ///
    fetchHotPolls (page, done) {
        // Get the current date and backtrack by 10 days.
        let now = new Date();
        now.setDate(now.getDate() - 10);

        // Find all polls where the date of last interaction (comment post or vote) meets our
        // threshold.
        pollModel.find({ lastInteractionDate: { $gte: now }}).populate('authorId').exec().then((polls) => {
            // Any polls fetched?
            if (polls.length === 0) {
                return done({ status: 404, message: 'There are no hot polls right now. Try again later.' });
            }

            // Find out the start-to-end range of the polls to be returned.
            const start = 0 + (20 * page);
            const end = start + 20 + 1;

            // Sort our polls by their heat and prepare them for return. Heat is gauged by
            // the number of times a poll is voted on and commented on.
            const hot = polls.sort((a, b) => b.heat - a.heat).slice(start, end).map((poll) => {
                return {
                    pollId: poll._id.toString(),
                    issue: poll.issue,
                    authorId: poll.authorId._id,
                    authorName: poll.authorId.name,
                    postDate: poll.postDate,
                    voteCount: poll.voteCount,
                    commentCount: poll.commentCount,
                    editCount: poll.editCount,
                    closed: poll.closed,
                };
            });

            // Return our polls.
            return done(null, {
                polls: hot.slice(0, 20),
                lastPage: hot.length < 21
            });
        }).catch((err) => {
            console.error(`pollController.fetchHotPolls (fetch polls) - ${err.stack}`);
            return done({ status: 500, message: 'Something went wrong while searching for polls. Try again later.' });
        });
    },

    ///
    /// @fn     fetchRecentPolls
    /// @brief  Fetches all recent polls, sorted by post date.
    ///
    /// @param  {number}    page The page of polls to fetch.
    /// @param  {function}  done Run when finished.
    ///
    fetchRecentPolls (page, done) {
        pollModel.find({})
            .sort('-postDate')
            .skip(20 * page)
            .limit(21)
            .populate('authorId')
            .exec()
            .then((polls) => {
                if (polls.length === 0) {
                    return done({
                        status: 404,
                        message: 'No polls were found.',
                        details: page > 0 ? [ 'Try searching in a lower page.' ] : null
                    });
                }

                const sliced = polls.slice(0, 20).map((poll) => {
                    return {
                        pollId: poll._id.toString(),
                        issue: poll.issue,
                        authorId: poll.authorId._id,
                        authorName: poll.authorId.name,
                        postDate: poll.postDate,
                        voteCount: poll.voteCount,
                        commentCount: poll.commentCount,
                        editCount: poll.editCount,
                        closed: poll.closed,
                    };
                });

                return done(null, {
                    polls: sliced,
                    lastPage: polls.length < 21
                });
            })
            .catch((err) => {
                console.error(`pollController.fetchRecentPolls (fetch polls) - ${err.stack}`);
                return done({ status: 500, message: 'Something went wrong while fetching your blogs. Try again later.' });
            });
    },

    ///
    /// @fn     castVote
    /// @brief  Casts a vote on a poll.
    ///
    /// Details:
    ///     userId, pollId, choiceId, isUser
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    castVote (details, socket, done) {
        // Drippity Drip Drip
        waterfall(
            [
                // First, find the poll with the given ID.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }

                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.castVote (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Attempt to cast the vote.
                (poll, next) => {
                    // Check to see if the poll requires a login.
                    if (poll.requiresLogin && !details.isUser) {
                        return next({ status: 401, message: 'You need to be logged in to vote on this poll.' });
                    }

                    // Make sure the user did not already vote on the poll.
                    if (poll.votedFor(details.userId) !== null) {
                        return next({ status: 409, message: 'You already voted on this poll!' });
                    }

                    // Attempt to cast the vote.
                    const error = poll.castVote(details.userId, details.choiceId);
                    if (error) {
                        return next({ status: 400, message: error });
                    }

                    // Update the poll.
                    poll.save().then(() => {
                        // Broadcast the updated poll.
                        socket.emit('cast vote', {
                            pollId: details.pollId,
                            choiceId: details.choiceId
                        });

                        // Done.
                        return next(null);
                    }).catch((err) => {
                        console.error(`pollController.castVote (save poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while updating the poll. Try again later.' });
                    });
                }
            ],
            (err) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your vote has been cast!'
                });
            }
        );
    },

    ///
    /// @fn     addChoice
    /// @brief  Adds a new choice to the poll.
    ///
    /// Details:
    ///     userId, pollId, body
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    addChoice (details, socket, done) {
        // Drippity Drippity Drippitah!
        waterfall(
            [
                // Validate the newly entered choice.
                (next) => {
                    if (!details.body) {
                        return next({ status: 400, message: 'Please enter a choice to write in.' });
                    }

                    if (details.body.length > 140) {
                        return next({ status: 400, message: 'Your write-in choice contains more than 140 characters.' });
                    }

                    return next(null);
                },

                // Find the poll in our database.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }

                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.addChoice (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Add our choice to the poll.
                (poll, next) => {
                    // Make sure the user did not already vote on the poll.
                    if (poll.votedFor(details.userId) !== null) {
                        return next({ status: 409, message: 'You already voted on this poll!' });
                    }

                    // Attempt to add the choice to our poll.
                    const error = poll.addChoice(details.userId, details.body);
                    if (error) {
                        return next({ status: 400, message: error });
                    }

                    // Update the poll.
                    poll.save().then((p) => {
                        // Broadcast the updated poll.
                        socket.emit('add choice', {
                            pollId: details.pollId,
                            choiceId: p.choices[p.choices.length - 1]._id.toString(),
                            body: details.body,
                            editCount: poll.editCount,
                            isAuthor: details['userId'] === p.authorId.toString()
                        });

                        // Done.
                        return next(null, p.choices[p.choices.length - 1]._id.toString());
                    }).catch((err) => {
                        console.error(`pollController.addChoice (save poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while updating the poll. Try again later.' });
                    });
                }
            ],
            (err, choiceId) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your choice has been added!',
                    choiceId
                });
            }
        );
    },

    ///
    /// @fn     editPoll
    /// @brief  Edits the properties of a poll.
    ///
    /// Details:
    ///     userId, pollId, issue, choices, requiresLogin, canAddExtraChoices, pollWillClose, closeDate
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    editPoll (details, socket, done) {
        // Drippity Drippity Drippitah!
        waterfall(
            [
                // First, validate the poll credentials we were given.
                (next) => {
                    // Track validation errors.
                    let errors = [];

                    // Check to see if the user entered an issue.
                    if (!details.issue) {
                        errors.push('Please enter an issue.');
                    }

                    // The poll issue must contain 280 characters or fewer.
                    else if (details.issue.length > 280) {
                        errors.push('The poll issue must contain 280 characters or fewer.');
                    }

                    // If the poll is set to close, make sure the close date is actually a point in
                    // the future.
                    const closeDate = details.pollWillClose ? new Date(details.closeDate) : new Date();
                    if (details.pollWillClose && Date.now() >= closeDate.getTime()) {
                        errors.push('The poll\'s close date needs to be a point in the future.');
                    }

                    // Make sure the user added at least one keyword to the poll.
                    if (!details.keywords || details.keywords.length === 0) {
                        errors.push('Polls must have at least one keyword.');
                    }

                    // Check to see if any validation errors were raised.
                    if (errors.length > 0) {
                        return next({
                            status: 400,
                            message: 'There were validation errors in the poll you submitted.',
                            details: errors
                        });
                    }

                    // Next function.
                    return next(null, closeDate);
                },

                // Find the poll in our database.
                (closeDate, next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }

                        if (poll.authorId.toString() !== details.userId) {
                            return next({ status: 403, message: 'You are not the author of this poll.' });
                        }

                        return next(null, poll, closeDate);
                    }).catch((err) => {
                        console.error(`pollController.editPoll (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Revise our poll.
                (poll, closeDate, next) => {
                    poll.issue = details.issue;
                    poll.keywords = details.keywords;
                    poll.requiresLogin = details.requiresLogin;
                    poll.canAddExtraChoices = details.canAddExtraChoices;
                    poll.pollWillClose = details.pollWillClose;
                    poll.closeDate = details.pollWillClose ? closeDate : null;
                    poll.editCount++;

                    // Check for any removed choices.
                    poll.choices = poll.choices.filter((c) => {
                        return details.removedChoices.indexOf(c._id.toString()) === -1;
                    });

                    // Check for any edited choices.
                    for (const pollChoice of poll.choices) {
                        for (const editedChoice of details.editedChoices) {
                            if (pollChoice._id.toString() === editedChoice.choiceId) {
                                pollChoice.body = editedChoice.body;
                            }
                        }
                    }
                    
                    // Update the poll.
                    poll.save().then((poll) => {
                        // Broadcast the updated poll.
                        socket.emit('edit poll', {
                            pollId: details.pollId,
                            issue: poll.issue,
                            choices: poll.choices.map(c => { return { choiceId: c._id.toString(), body: c.body, votes: c.voters.length }; }),
                            keywords: poll.keywords,
                            requiresLogin: poll.requiresLogin,
                            canAddExtraChoices: poll.canAddExtraChoices,
                            pollWillClose: poll.pollWillClose,
                            closeDate: poll.closeDate,
                            editCount: poll.editCount
                        });
                        
                        // Done.
                        return next(null, details.pollId);
                    }).catch((err) => {
                        console.error(`pollController.editPoll (save poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while updating the poll. Try again later.' });
                    });
                }
            ],
            (err, id) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your poll has been revised!',
                    pollId: id
                });
            }
        );
    },

    ///
    /// @fn     editComment
    /// @brief  Edits a comment on a poll.
    ///
    /// Details:
    ///     userId, pollId, commentId, body
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    editComment (details, socket, done) {
        waterfall(
            [
                // Validate the comment.
                (next) => {
                    if (!details.body) {
                        return next({ status: 400, message: 'Please enter a comment.' });
                    }

                    if (details.body.length > 280) {
                        return next({ status: 400, message: 'Your comment contains too many characters.' });
                    }

                    return next(null);
                },

                // Find the poll in our database.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }

                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.editComment (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Find the comment in the poll and edit it.
                (poll, next) => {
                    const error = poll.editComment(details.userId, details.commentId, details.body);
                    if (error) {
                        return next({ status: 400, message: error });
                    }

                    poll.save().then(() => {
                        // Broadcast the updated comment.
                        socket.emit('edit comment', {
                            pollId: details.pollId,
                            commentId: details.commentId,
                            body: details.body
                        });

                        // Done.
                        return next(null);
                    }).catch((err) => {
                        console.error(`pollController.editComment (update poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while updating the poll. Try again later.' });
                    });
                }
            ],
            (err) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your comment has been edited!'
                });
            }
        )
    },

    ///
    /// @fn     removeComment
    /// @brief  Removes a comment from a poll.
    ///
    /// Details:
    ///     userId, pollId, commentId
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    removeComment (details, socket, done) {
        waterfall(
            [
                // Find the poll in our database.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }

                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.removeComment (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Find the comment in the poll and remove it.
                (poll, next) => {
                    const error = poll.removeComment(details.userId, details.commentId);
                    if (error) {
                        return next({ status: 400, message: error });
                    }

                    poll.save().then(() => {
                        socket.emit('remove comment', {
                            pollId: details.pollId,
                            commentId: details.commentId
                        });

                        // Done.
                        return next(null);
                    }).catch((err) => {
                        console.error(`pollController.removeComment (update poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while updating the poll. Try again later.' });
                    });
                }
            ],
            (err) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your comment has been removed!'
                });
            }
        )
    },

    ///
    /// @fn     removePoll
    /// @brief  Removes a poll.
    ///
    /// Details:
    ///     userId, pollId
    ///
    /// @param  {object}    details The details object.
    /// @param  {object}    socket The Socket.IO object.
    /// @param  {function}  done Run when finished.
    ///
    removePoll (details, socket, done) {
        waterfall(
            [
                // Find the poll in our database.
                (next) => {
                    pollModel.findById(details.pollId).then((poll) => {
                        if (!poll) {
                            return next({ status: 404, message: 'A poll with this ID was not found.' });
                        }
                        
                        if (poll.authorId.toString() !== details.userId) {
                            return next({ status: 403, message: 'You are not the author of this poll.' });
                        }

                        return next(null, poll);
                    }).catch((err) => {
                        console.error(`pollController.removePoll (find poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while finding the poll. Try again later.' });
                    });
                },

                // Remove the poll.
                (poll, next) => {
                    poll.remove().then(() => {
                        // Broadcast the removed poll.
                        socket.emit('remove poll', {
                            pollId: details.pollId
                        });

                        // Done.
                        return next(null);
                    }).catch((err) => {
                        console.error(`pollController.removePoll (remove poll) - ${err.stack}`);
                        return next({ status: 500, message: 'Something went wrong while removing the poll. Try again later.' });
                    });
                }
            ],
            (err) => {
                if (err) { return done(err); }
                return done(null, {
                    message: 'Your poll has been removed!'
                });
            }
        )
    }
};