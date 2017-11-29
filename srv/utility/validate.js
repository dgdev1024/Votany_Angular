///
/// @file   validate.js
/// @brief  Functions for validating user credentials.
///

// Imports
const regex = require('./regex');

// Exports
//
// All validation functions return a blank string if they pass,
// and a non-empty string if they fail, with the reason for the failure.
module.exports = {
    // Validates a first and last name.
    fullName (first, last) {
        // Make sure the user entered both a first and last name.
        if (!first || !last) {
            return 'Please enter a first and last name.';
        }

        // Make sure the name has no numbers or symbols.
        else if (regex.numbers.test(first) || regex.numbers.test(last) || regex.symbols.test(first) || regex.numbers.test(last)) {
            return 'Your first and last name should contain no numbers or symbols.';
        }

        // Good.
        return '';
    },

    // Tests a submitted email address.
    emailAddress (email) {
        // Make sure the user enters something.
        if (!email) {
            return 'Please enter an email address.';
        }

        // And make sure that something is a valid email address ('dgdev1024@gmail.com').
        else if (!regex.emails.test(email)) {
            return 'Please enter a valid email address.'
        }

        // Good.
        return '';
    },

    // Tests a submitted and retyped password.
    password (pass, confirm) {
        // Make sure the user entered and retyped a password...
        if (!pass) { 
            return 'Please enter a password.'; 
        }
        else if (!confirm) { 
            return 'Please confirm your password.'; 
        }

        // Make sure the passwords match.
        else if (pass !== confirm) { 
            return 'The passwords do not match.'; 
        }

        // Make sure the password has between 8 and 30 characters in length.
        else if (pass.length < 8 || pass.length > 30) {
            return 'Passwords must have between 8 and 30 characters.';
        }

        // Make sure the password contains at least one capital letter, one number,
        // and symbol.
        else if (!regex.capitals.test(pass) || !regex.numbers.test(pass) || !regex.symbols.test(pass)) {
            return 'Passwords must contain at least one capital letter, one number, and one symbol.';
        }

        // Good.
        return '';
    }
};