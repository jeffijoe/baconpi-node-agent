/**
 * Time utilities
 */
/*global module, require*/
'use strict';
var format = require('util').format;
module.exports = {
  now: function () {
    var now = new Date(),
        dd = now.getDate(),
        mm = now.getMonth()+1,
        yyyy = now.getFullYear(),
        hh = now.getHours(),
        i = now.getMinutes(),
        ss = now.getSeconds();
    return format('%d-%d-%d %d:%d:%d', dd, mm, yyyy, hh, i, ss);
  }
}