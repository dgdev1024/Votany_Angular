///
/// @file   email.js
/// @brief  Functions for sending email.
///

// Imports
const nodemailer = require('nodemailer');

// Email Transport
const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        type: 'oauth2',
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
        accessToken: process.env.EMAIL_ACCESS_TOKEN
    }
});

// The sender string.
const senderString = `${process.env.SITE_AUTHOR} <${process.env.EMAIL_ADDRESS}>`;

///
/// @fn     localUserVerification
/// @brief  Sends an email asking a new user to verify their account.
///
/// Details:
///     emailAddress, displayName, verifyUrl
///
/// @param {object} details The details object.
/// @param {function} done Run when finished.
///
module.exports.localUserVerification = (details, done) => {
    // The link the user will need to click in order to verify their account.
    const url = `${process.env.SITE_URL}/user/verify/${details.verifyUrl}`;

    // The email's HTML body.
    const body = `
        <div style="#C6C7C6">
            <h1 style="margin: 0px; padding: 8px; width: 100%; color: white; background-color: #052A03;">
                Hello, ${details.displayName}!
            </h1>
            <p style="padding-top: 16px;">
                Click on the link below in order to verify your newly-created account:<br />
                <a href="${url}">${url}</a>
            </p>
            <p>
                Thank you for joining ${process.env.SITE_TITLE}! I hope you enjoy the site!<br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    // Create the email object and attempt to send the email.
    transport.sendMail({
        from: senderString,
        to: `${details.displayName} <${details.emailAddress}>`,
        subject: `${process.env.SITE_TITLE}: Verify Your Account.`,
        html: body
    }).then(() => { return done(null); })
      .catch((err) => { return done(err); });
};

///
/// @fn     passwordTokenIssued
/// @brief  Lets the user know that a password reset token was issued.
///
/// Details:
///     emailAddress, displayName, authenticateId, authenticateCode
///
/// @param {object} details The details object.
/// @param {function} done Run when finished.
///
module.exports.passwordTokenIssued = (details, done) => {
    // The link the user will need to click in order to reach the authentication page.
    const url = `${process.env.SITE_URL}/user/authenticatePasswordToken/${details.authenticateId}`;

    // The email's HTML body.
    const body = `
        <div style="#C6C7C6">
            <h1 style="margin: 0px; padding: 8px; width: 100%; color: white; background-color: #052A03;">
                Hello, ${details.displayName}!
            </h1>
            <p style="padding-top: 16px;">
                You are receiving this email because a password reset token was issued for your account.<br />
                If you requested this token, then please enter the following code at the authentication page:<br /><br />
                ${details.authenticateCode}<br /><br />
                You have 15 minutes to authenticate the token and change your password before the token expires.<br />
                If you did not request the token, then you may safely disregard this email and let the token expire.
            </p>
            <p>
                If, for any reason, you need to return to the authentication page at any point, then you may do so
                by clicking the following link:<br /><br />
                <a href="${url}">${url}</a>
            </p>
            <p>
                Thank you for joining ${process.env.SITE_TITLE}! I hope you enjoy the site!<br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    // Create the email object and attempt to send the email.
    transport.sendMail({
        from: senderString,
        to: `${details.displayName} <${details.emailAddress}>`,
        subject: `${process.env.SITE_TITLE}: Password Reset Token Issued.`,
        html: body
    }).then(() => { return done(null); })
        .catch((err) => { return done(err); });
};

///
/// @fn     passwordChanged
/// @brief  Lets the user know that their password was changed.
///
/// Details:
///     emailAddress, displayName
///
/// @param {object} details The details object.
/// @param {function} done Run when finished.
///
module.exports.passwordChanged = (details, done) => {
    // The email's HTML body.
    const body = `
        <div style="#C6C7C6">
            <h1 style="margin: 0px; padding: 8px; width: 100%; color: white; background-color: #052A03;">
                Hello, ${details.displayName}!
            </h1>
            <p style="padding-top: 16px;">
                You are getting this email because your password has been changed.<br />
                If you performed this action, then you may safely disregard this email.<br />
                However, if you did not, then please reply to this email, as your account may
                have been compromised.
            </p>
            <p>
                Thank you for using ${process.env.SITE_TITLE}! I hope you continue enjoying the site!<br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    // Create the email object and attempt to send the email.
    transport.sendMail({
        from: senderString,
        to: `${details.displayName} <${details.emailAddress}>`,
        subject: `${process.env.SITE_TITLE}: Password Changed.`,
        html: body
    }).then(() => { return done(null); })
      .catch((err) => { return done(err); });
};
