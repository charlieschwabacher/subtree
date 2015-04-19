// recursively call Object.freeze on an object and its keyerties

'use strict';

module.exports = function deepFreeze(object) {

  if (!(object instanceof Object)) {
    return object;
  }for (var key in object) {
    if (!object.hasOwnProperty(key)) continue;
    var value = object[key];

    if (value != null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
};