///
/// @file   auth.js
/// @brief  API routing for our authentication functions.
///

// Imports
const express           = require('express');
const passport          = require('passport');
const userController    = require('../controllers/user');
const tokenController   = require('../controllers/token');
const auth              = require('../utility/auth');

// Create our router.
module.exports = (io) => {
    // Express Router
    const router = express.Router();

    // Passport Login Strategies
    passport.use('local-login', auth.strategies.local);
    passport.use('twitter-login', auth.strategies.twitter);
    passport.use('facebook-login', auth.strategies.facebook);

    // POST: Local Registration
    router.post('/register', (req, res) => {
        userController.registerLocalUser({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            emailAddress: req.body.emailAddress,
            password: req.body.password,
            confirm: req.body.confirm
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json(ok);
        });
    });

    // GET: Local Account Verification
    router.get('/verify/:verifyId', (req, res) => {
        userController.verifyLocalUser(req.params.verifyId, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json(ok);
        });
    });

    // POST: Issue Password Token.
    router.post('/issuePasswordToken', (req, res) => {
        tokenController.issueToken(req.body.emailAddress, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json(ok);
        });
    });

    // POST: Authenticate Password Token
    router.post('/authenticatePasswordToken/:authenticateId', (req, res) => {
        tokenController.authenticateToken(req.params.authenticateId, req.body.authenticateCode, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json(ok);
        });
    });

    // POST: Change Password
    router.post('/changePassword/:authenticateId', (req, res) => {
        tokenController.changePassword({
            id: req.params.authenticateId,
            password: req.body.password,
            confirm: req.body.confirm
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json(ok);
        });
    });

    // POST: Local Login
    router.post('/login/local', (req, res) => {
        // Make sure the user entered their credentials, first.
        if (!req.body.emailAddress && !req.body.password) {
            return res.status(400).json({ error: { status: 401, message: 'Please enter your login credentials.' }});
        }
        else if (!req.body.emailAddress) {
            return res.status(400).json({ error: { status: 401, message: 'Please enter your email address.' }});
        }
        else if (!req.body.password) {
            return res.status(400).json({ error: { status: 401, message: 'Please enter your password.' }});
        }

        passport.authenticate('local-login', { session: false }, (err, user, info) => {
            // Any errors with authentication?
            if (err) {
                return res.status(err.status).json({ error: err });
            }

            // Was the user authenticated successfully?
            if (!user) {
                return res.status(401).json({ error: { status: 401, message: info.message }});
            }

            // Generate a JWT.
            const token = user.generateJwt();
            return res.status(200).json({ token });
        })(req, res);
    });

    // GET x2: Twitter Login
    router.get('/login/twitter', passport.authenticate('twitter-login', { session: false }));
    router.get('/login/twitter/callback', (req, res) => {
        passport.authenticate('twitter-login', { session: false }, (err, user) => {
            // Any errors?
            if (err) {
                return res.status(err.status).json({ error: err });
            }

            // If the user wasn't found, then a new one was created.
            // Generate a JWT and return it to the user.
            const token = user.generateJwt();

            // Please note that we are using Passport's social media login strategies, which
            // involve redirects to their API pages, then to a callback URL like this route.
            //
            // This makes storing our JWT token on the frontend a bit hairy, so we send the
            // created JWT token to the frontend in a query parameter.
            return res.redirect(`/finishlogin?jwt=${token}`);
        })(req, res);
    });

    // GET x2: Facebook Login
    router.get('/login/facebook', passport.authenticate('facebook-login', { session: false }));
    router.get('/login/facebook/callback', (req, res) => {
        passport.authenticate('facebook-login', { session: false }, (err, user) => {
            if (err) {
                return res.status(err.status).json({ error: err });
            }

            const token = user.generateJwt();

            return res.redirect(`/finishlogin?jwt=${token}`);
        })(req, res);
    });

    // Return Router
    return router;
};