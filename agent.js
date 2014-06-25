/**
 * @module agent
 * @author Jeff Hansen
 * @description Agent Bacon
 */
/*global require, console, module*/
'use strict';

var 
    pkg = require('./package.json'),
    io = require('socket.io-client'),
    querystring = require('querystring'),
    time = require('./lib/time'),
    getMac = require('getmac').getMac,
    getSocketSession = require('./lib/get_socket_session'),
    urlHelper = require('url'),
    wol = require('wake_on_lan');

module.exports = function(agentOpts) {
  /**
   * Module requirements
   */
  var endpoint = agentOpts.endpoint,
      sessionPort = agentOpts.sessionPort,
      socketPort = agentOpts.socketPort;

  console.log('');
  console.log('=== Agent Bacon (v'+pkg.version+') started @ ' + time.now());
  console.log('=== Copyright (C) Jeff Hansen - Jeffijoe.com 2014.');
  console.log('=== Endpoint: ', endpoint);
  console.log('');

  // Hit the server for a cookie.
  log('Establishing session with server..');
  getSocketSession({
    url: urlHelper.resolve(endpoint + ':' + sessionPort, '/api/session/establish')
  }, function(err, query) {
    if (err) throw err;
    log('Grabbing MAC address...');
    getMac(function(err, mac) {
      if (err) throw err;
      log('MAC address:  ' + mac);
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
    console.log(message);
  }

  /**
   * Connects to the Socket server.
   * @param  {object} query
   */

  function setupSocket(query) {
    log('Connecting to socket server..');
    var socket = io.connect(endpoint + ':' + socketPort + '/agentsocket', {
      query: query
    });
    socket.on('connect', function() {
      log('Socket connected and ready to receive wake-up calls! Woo!');
    });
    socket.on('wake', function(data) {
      log('Wake signal received for MAC: ' + data.mac);
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
      log('Disconnected from socket server. Will attempt to reconnect soon.');
    });
    socket.on('error', function(err) {
      log('Socket error: ' + err);
    });
  }
};
