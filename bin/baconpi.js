#!/usr/bin/env node
/**
 * BaconPi CLI program
 * @author  Jeff Hansen
 */
/*global process, require*/
'use strict';
var baconpi = require('../agent');

baconpi({
    endpoint: process.argv[2] || 'https://baconpi-jeffijoe.rhcloud.com',
    sessionPort: process.argv[3] || '443',
    socketPort: process.argv[4] || 8443
});