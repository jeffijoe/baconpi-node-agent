/**
 * Time utilities
 */
/*global module, require*/
'use strict';
var format = require('util').format;

/**
 * Quick method for padding a number.
 */
function lead(number) {
  return ('00' + number).slice(-2);
}

module.exports = {
  now: function() {
    var now = new Date(),
      dd = lead(now.getDate()),
      mm = lead(now.getMonth() + 1),
      yyyy = now.getFullYear(),
      hh = lead(now.getHours()),
      i = lead(now.getMinutes()),
      ss = lead(now.getSeconds());
    return format('%s-%s-%s %s:%s:%s', dd, mm, yyyy, hh, i, ss);
  }
};