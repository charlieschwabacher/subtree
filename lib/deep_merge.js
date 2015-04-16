'use strict';

function isObject(o) {
  return o != null && toString.call(o) === '[object Object]';
}

module.exports = function deepMerge(src, data) {

  var dst = Array.isArray(src) ? [] : {};

  for (var key in src) {
    dst[key] = src[key];
  }

  for (var key in data) {
    if (isObject(data[key]) && isObject(src[key])) dst[key] = deepMerge(src[key], data[key]);else dst[key] = data[key];
  }

  return dst;
};