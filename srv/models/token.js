///
/// @file   token.js
/// @brief  The database model for our password reset tokens.
///

// Imports
const mongoose  = require('mongoose');
const bcryptjs  = require('bcryptjs');
const uuid      = require('uuid');

// Schema
const schema = new mongoose.Schema({
    // The email address of the LOCAL user requesting the password reset token.
    emailAddress: { type: String, required: true, unique: true },

    // The identifying portion of the token's authentication URL, as well as the
    // hash of the code the user will need to enter in order to authenticate the token.
    authenticateId: { type: String, required: true, unique: true },
    authenticateCode: { type: String, required: true },

    // Has the token been authenticated? Has the token already been spent
    // on a password reset?
    authenticated: { type: Boolean, default: false },
    spent: { type: Boolean, default: false },

    // The lifetime of the token. The user will need to authenticate and spend the
    // token before it expires.
    lifetime: { type: Date, default: Date.now, expires: 900 }
});

// Generate an authenticate URL ID and a code. Returns the code.
schema.methods.generate = function () {
    // Generate and assign the URL ID.
    this.authenticateId = uuid.v4();

    // Generate and hash the authentication code. The unhashed code will be returned.
    const salt = bcryptjs.genSaltSync();
    const code = uuid.v4();
    this.authenticateCode = bcryptjs.hashSync(code, salt);

    // Return the code.
    return code;
};

// Checks an authentication code against a code submitted.
schema.methods.check = function (code) {
    return bcryptjs.compareSync(code, this.authenticateCode) ?
        'OK' : 'WRONG';
};

// Compile and export the model.
module.exports = mongoose.model('password-token', schema);