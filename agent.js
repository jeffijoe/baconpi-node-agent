/**
 * @module agent
 * @author Jeff Hansen
 * @description Agent Bacon
 */
/*global require, console, process*/
'use strict';
/**
 * Module requirements
 */
var io = require('socket.io-client'),
  querystring = require('querystring'),
  getMac = require('getmac').getMac,
  getSocketSession = require('./lib/get_socket_session'),
  urlHelper = require('url'),
  wol = require('wake_on_lan'),
  endpoint = process.argv[2] || 'http://localhost:1337';

console.log('');
console.log('=== Agent Bacon taking care of your shit ===');
console.log('=== Endpoint: ', endpoint);
console.log('');

// Hit the server for a cookie.
getSocketSession({
  url: urlHelper.resolve(endpoint, '/agentsocket/session')
}, function(err, query) {
  if (err) throw err;
  getMac(function(err, mac) {
    if (err) throw err;
    createQuery(query, mac);
  });
});

/**
 * Creates the Socket.IO Query
 * @param  {string} mac Mac address of this device.
 */

function createQuery(query, mac) {
  query.mac = mac;
  query.clientType = 'agent';
  var stringifiedQuery = querystring.stringify(query);
  setupSocket(stringifiedQuery);
}

/**
 * Connects to the Socket server.
 * @param  {object} query
 */

function setupSocket(query) {
  var socket = io.connect(endpoint + '/agentsocket', {
    query: query
  });
  socket.on('connect', function() {
    console.info('Socket connected!');
  });
  socket.on('wake', function(data) {
    console.log('Wake signal received for mac ', data.mac);
    if (!data.mac) {
      return socket.emit('signal:error', {
        error: 'Mac Adress was not sent along with wakeup call.'
      });
    }
    wol.wake(data.mac, function(err) {
      if (err) {
        console.log('Wakeup failed: ', err);
        return socket.emit('signal:error', {
          error: err.message,
          mac: data.mac
        });
      }
      console.log('Wakeup signal sent!');
      socket.emit('signal:send', data);
    });
  });
  socket.on('disconnect', function() {
    console.info('Disconnected.');
  });
  socket.on('error', function(err) {
    console.error('Socket error: ' + err);
  });
}
