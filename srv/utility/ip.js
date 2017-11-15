///
/// @file   ip.js
/// @brief  Retrieves the IP address from a request header.
///

module.exports = (request) => {
    // Try to fetch the "X-Forwarded-For" request header.
    const forwardedFor = request.headers["x-forwarded-for"];
    
    // Check to see if the header was found.
    if (forwardedFor) {
        // Split the string into commas and return the first element of
        // the resulting array.
        return forwardedFor.split(',')[0].trim();
    } else {
        // Otherwise, return the connection's remote address.
        return request.connection.remoteAddress;
    }
};