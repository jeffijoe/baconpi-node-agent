/**
 * @module agent
 * @author Jeff Hansen
 * @description Agent Bacon
 */
/*global require, console, process*/
'use strict';
module.exports = function(agentOpts) {
  /**
   * Module requirements
   */
  var io = require('socket.io-client'),
    querystring = require('querystring'),
    time = require('./lib/time'),
    getMac = require('getmac').getMac,
    getSocketSession = require('./lib/get_socket_session'),
    urlHelper = require('url'),
    wol = require('wake_on_lan'),
    endpoint = process.argv[2] || 'https://baconpi-jeffijoe.rhcloud.com',
    sessionPort = process.argv[3] || '443',
    socketPort = process.argv[4] || 8443;

  console.log('');
  console.log('=== Agent Bacon started @ ' + time.now());
  console.log('=== Endpoint: ', endpoint);
  console.log('');

  // Hit the server for a cookie.
  getSocketSession({
    url: urlHelper.resolve(endpoint + ':' + sessionPort, '/api/session/establish')
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
   * Writes to stdout with a timestamp prepended to each message.
   * @return {[type]} [description]
   */

  function log(message) {
    message = '[' + time.now() + '] ' + message;
    var args = [message].concat(Array.prototype.slice(arguments, 1));
    console.log.apply(console, args);
  }

  /**
   * Connects to the Socket server.
   * @param  {object} query
   */

  function setupSocket(query) {
    var socket = io.connect(endpoint + ':' + socketPort + '/agentsocket', {
      query: query
    });
    socket.on('connect', function() {
      log('Socket connected!');
    });
    socket.on('wake', function(data) {
      log('Wake signal received for mac ', data.mac);
      if (!data.mac) {
        return socket.emit('signal:error', {
          error: 'Mac Adress was not sent along with wakeup call.'
        });
      }
      wol.wake(data.mac, function(err) {
        if (err) {
          log('Wakeup failed: ', err);
          return socket.emit('signal:error', {
            error: err.message,
            mac: data.mac
          });
        }
        log('Wakeup signal sent!');
        socket.emit('signal:send', data);
      });
    });
    socket.on('disconnect', function() {
      log('Disconnected.');
    });
    socket.on('error', function(err) {
      log('Socket error: ' + err);
    });
  }
};
