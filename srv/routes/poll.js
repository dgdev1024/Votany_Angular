///
/// @file   poll.js
/// @brief  API routing for our poll functions.
///

// Imports
const express           = require('express');
const pollController    = require('../controllers/poll');
const authentication    = require('../utility/auth');
const getIp             = require('../utility/ip');

// Export Router Function
module.exports = (socket) => {
    const router = express.Router();

    // POST: Creates a new poll. Requires authentication.
    router.post('/create', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.createPoll({
                userId: user.id,
                userName: user.name,
                issue: req.body.issue,
                choices: req.body.choices,
                requiresLogin: req.body.requiresLogin,
                canAddExtraChoices: req.body.canAddExtraChoices,
                pollWillClose: req.body.pollWillClose,
                closeDate: req.body.pollWillClose ? req.body.closeDate : null,
                keywords: req.body.keywords
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // POST: Posts a comment on a poll.
    router.post('/comment/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.postComment({
                userId: user.id,
                userName: user.name,
                pollId: req.params.pollId,
                body: req.body.body
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // GET: Retrieves a poll with the given ID.
    router.get('/view/:pollId', authentication.checkJwt, (req, res) => {
        // Authentication will be performed here, but it is not required to view the poll.
        authentication.testLogin(req, (err, user) => {
            if (err && err.status === 500) { return res.status(err.status).json({ error: err }); }

            // Determine the identity of whoever is accessing this route.
            //
            // If the accesser is a registered user, then use their user ID.
            // If the accesser is not registered, then use their IP address.
            let voterId = '';
            if (user)   { voterId = user.id; }
            else        { voterId = getIp(req); }

            // Now fetch the poll.
            pollController.fetchPoll(req.params.pollId, voterId, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // GET: Fetches a batch of comments on a given poll.
    router.get('/comments/:pollId', (req, res) => {
        pollController.fetchPollComments(
            req.params.pollId,
            parseInt(req.query.page) || 0,
            (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            }
        )
    });

    // GET: Searches for polls by the given keywords.
    router.get('/search', (req, res) => {
        pollController.searchForPolls(
            req.query.query,
            parseInt(req.query.page) || 0,
            (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            }
        );
    });

    // GET: Searches for polls posted by a given user.
    router.get('/by/:userId', (req, res) => {
        pollController.fetchPollsByUser(
            req.params.userId,
            parseInt(req.query.page) || 0,
            (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            }
        );
    });

    // GET: Searches for the hottest polls right now.
    router.get('/hot', (req, res) => {
        pollController.fetchHotPolls(
            parseInt(req.query.page) || 0,
            (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            }
        )
    });

    // GET: Fetches all recent polls.
    router.get('/recent', (req, res) => {
        pollController.fetchRecentPolls(
            parseInt(req.query.page) || 0,
            (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            }
        )
    });

    // PUT: Casts a vote on a poll.
    router.put('/vote/:pollId', authentication.checkJwt, (req, res) => {
        // Authentication will be performed here, but it is not required to view the poll.
        authentication.testLogin(req, (err, user) => {
            if (err && err.status === 500) { return res.status(err.status).json({ error: err }); }

            // Determine the identity of whoever is accessing this route.
            //
            // If the accesser is a registered user, then use their user ID.
            // If the accesser is not registered, then use their IP address.
            let voterId = '';
            if (user)   { voterId = user.id; }
            else        { voterId = getIp(req); }

            // Cast the vote.
            pollController.castVote({
                userId: voterId,
                pollId: req.params.pollId,
                choiceId: req.body.choiceId,
                isUser: user
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // PUT: Adds a new choice to the poll.
    router.put('/addChoice/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.addChoice({
                userId: user.id,
                pollId: req.params.pollId,
                body: req.body.body
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // PUT: Edits a poll.
    router.put('/edit/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.editPoll({
                userId: user.id,
                pollId: req.params.pollId,
                issue: req.body.issue,
                keywords: req.body.keywords,
                requiresLogin: req.body.requiresLogin,
                canAddExtraChoices: req.body.canAddExtraChoices,
                pollWillClose: req.body.pollWillClose,
                closeDate: req.body.pollWillClose === true ? req.body.closeDate : null
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // PUT: Edits a comment on a poll.
    router.put('/editComment/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.editComment({
                userId: user.id,
                pollId: req.params.pollId,
                commentId: req.body.commentId,
                body: req.body.body
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // DELETE: Removes a comment from a poll.
    router.put('/removeComment/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.removeComment({
                userId: user.id,
                pollId: req.params.pollId,
                commentId: req.body.commentId
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    // DELETE: Removes a poll.
    router.delete('/removePoll/:pollId', authentication.checkJwt, (req, res) => {
        authentication.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            pollController.removePoll({
                userId: user.id,
                pollId: req.params.pollId
            }, socket, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    return router;
};