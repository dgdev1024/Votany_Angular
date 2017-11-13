///
/// @file   regex.js
/// @brief  Regular expressions used by the backend.
///

// Export
module.exports = {
    symbols: /[$-/:-?{-~!"^_`\[\]!@]/,
    capitals: /[A-Z]/,
    numbers: /[0-9]/,
    emails: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
};