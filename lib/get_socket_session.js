/**
 * @module getSocketCookie
 * @author Jeff Hansen
 * @description Creates a Socket.IO query including a Sails.JS cookie.
 */
/*global require, module, console*/
'use strict';

// Constants
var defaultSessionIdKey = 'sails.sid';
// Module dependencies
var request = require('request'),
    replay = require('request-replay'),
    format = require('util').format;
    
/**
 * Uses Request and Tough Cookie to get the Sails JS session ID,
 * and create a Socket.IO query
 * @param {object} opts Options.
 * @param  {Function} cb Callback.
 */
function getSocketSession(opts, cb) {
    var jar = request.jar(),
        url = opts.url,
        sessionIdKey = opts.sessionIdKey || defaultSessionIdKey;
        
    // Send the request.
    var reqOpts = {
        method: 'GET',
        url: url,
        jar: jar
    };
    replay(request(reqOpts, function(err) {
        if (err) cb(err, null);
        jar._jar.getCookies(url, function(err, cookies) {
            if (err) cb(err);
            // Get the session ID from the cookies.
            var sessionId = findSessionCookieValue(cookies, sessionIdKey);
            if (!sessionId) cb(new Error('Session ID not found.'));
            // Call back with the query.
            cb(null, {
                cookie: format('%s=%s', sessionIdKey, sessionId)
            });
            // Nullifies the callback so we know we did what we came here to do.
            cb = null;
        });
        
        if(cb)
            cb(new Error('Session cookie not found.'));
    })).on('replay', function (replay) {
        console.log('Request failed: ' + replay.error.code + ' ' + replay.error.message);
        console.log('Replay nr: #' + replay.number+1);
        console.log('Will retry in: ' + replay.delay + 'ms');
        console.log('-------------------');
    });
}

/**
 * Helpers
 */
function findSessionCookieValue(allCookies, sessionIdKey) {
    var cookies = allCookies.filter(function(cookie) {
        return cookie.key === sessionIdKey;
    });
    return cookies.length !== 0 ? cookies[0].value : null;
}

/**
 * Export the method.
 */
module.exports = getSocketSession;