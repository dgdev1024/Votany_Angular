///
/// @file   user.js
/// @brief  The database model for our registered users.
///

// Imports
const mongoose  = require('mongoose');
const bcryptjs  = require('bcryptjs');
const uuid      = require('uuid');
const jwt       = require('jsonwebtoken');

// Schema
const schema = new mongoose.Schema({
    // How is the user logging in?
    //
    // Are they using a traditional email/password approach ('local'),
    // or are they using a social media platform ('twitter', 'facebook')?
    loginMethod: {
        type: String,
        required: true,
        enum: [ 'local', 'facebook', 'twitter' ]
    },

    // The user's join date.
    joinDate: { type: Date, default: Date.now },

    // Details for users logging in locally...
    firstName: { type: String },
    lastName: { type: String },
    emailAddress: { type: String },
    passwordHash: { type: String },
    verified: { type: Boolean, default: false },
    verifyUrl: { type: String },
    verifyExpiry: { type: Date, default: Date.now, expires: 3600 },

    // Details for users logging in via social media...
    providerId: { type: String },
    displayName: { type: String }
});

// Don't fetch the model's name fields directly. Access them with
// this virtual instead.
schema.virtual('name').get(function () {
    if (this.loginMethod === 'local') {
        return `${this.firstName} ${this.lastName}`;
    } else {
        return this.displayName;
    }
});

// Generates a JSON web token for users who log in.
schema.methods.generateJwt = function () {
    // Set up an expiry date.
    let exp = new Date();
    exp.setDate(exp.getDate() + 1);

    // Create, sign, and return the token.
    return jwt.sign({
        _id: this._id.toString(),
        name: this.name,
        exp: parseInt(exp.getTime()) / 1000
    }, process.env.JWT_SECRET);
};

// Local Users Only: Generate a verify URL.
schema.methods.generateVerifyUrl = function () {
    this.verifyUrl = uuid.v4();
};

// Local Users Only: Sets a password for the user.
schema.methods.setPassword = function (password) {
    // Do not do this if we are logging in socially.
    if (this.loginMethod === 'local') {
        // Create a salt and use it to hash the password.
        const salt = bcryptjs.genSaltSync();
        this.passwordHash = bcryptjs.hashSync(password, salt);

        // OK.
        return 'OK';
    } else {
        return 'NOT_LOCAL';
    }
};

// Local Users Only: Checks the password submitted.
schema.methods.checkPassword = function (password) {
    // Does not apply to social users.
    if (this.loginMethod === 'local') {
        // Compare our passwords.
        return bcryptjs.compareSync(password, this.passwordHash) ? 'OK' : 'WRONG';
    } else {
        return 'NOT_LOCAL';
    }
};

// Compile and export the model.
module.exports = mongoose.model('user', schema);