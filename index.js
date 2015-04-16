(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var deepFreeze = require('./deep_freeze');
var deepMerge = require('./deep_merge');
var CursorCache = require('./cursor_cache');

var Cursor = undefined;

module.exports = {

  // make a cursor superclass accessible for type checking

  Cursor: Cursor = (function () {
    var _class = function () {
      _classCallCheck(this, _class);
    };

    return _class;
  })(),

  create: function create(inputData, onChange) {

    // this is the master reference to data, any change will replace this object

    var data = deepFreeze(inputData);

    // we use a cursor cache to ensure that any two cursors to the same object
    // will be referentially equal

    var cache = new CursorCache(function () {
      return data;
    });

    // when data changes, we queue queue only one update which runs after
    // execution ends

    var pending = false;

    // we keep an array of batched changes which will be passed to the callback
    // along with a cursor to the updated data

    var changes = [];

    // update the local reference to the data, and queue the onchange callback

    var update = function update(newData) {
      data = newData;
      if (!pending) {
        pending = true;
        setTimeout(function () {
          pending = false;
          onChange(new Cursor(), changes);
          changes = [];
        });
      }
      return newData;
    };

    // keep track of changes to the data

    var recordChange = function recordChange(method, args) {
      changes.push([method, args]);
    };

    // Creates a new data object from the existing data, but with the node
    // at fullPath modified by the modifier function, then passes the resulting
    // object to update

    var modifyAt = function modifyAt(fullPath, modifier) {
      var newData = Array.isArray(data) ? [] : {};
      var target = newData;
      for (var k in data) {
        target[k] = data[k];
      }var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = fullPath.slice(0, -1)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _key3 = _step.value;

          var next = target[_key3];
          var updated = Array.isArray(next) ? [] : {};
          for (var k in next) {
            updated[k] = next[k];
          }target[_key3] = updated;
          Object.freeze(target);
          target = updated;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var key = fullPath.slice(-1)[0];
      var result = modifier(target, key);
      Object.freeze(target);

      update(newData);

      return result;
    };

    // define some functions to update data

    var set = function set(fullPath, value) {
      if (fullPath.length > 0) {
        cache.clearPath(fullPath);
        modifyAt(fullPath, function (target, key) {
          target[key] = deepFreeze(value);
        });
      } else {
        cache.reset();
        update(value);
      }
      return value;
    };

    var del = function del(fullPath) {
      if (fullPath.length > 0) {
        cache.clearPath(fullPath);
        modifyAt(fullPath, function (target, key) {
          delete target[key];
        });
      } else {
        cache.reset();
        update(undefined);
      }
      return true;
    };

    var merge = function merge(fullPath, newData) {
      cache.clearObject(fullPath, newData);
      if (fullPath.length > 0) {
        return modifyAt(fullPath, function (target, key) {
          target[key] = deepMerge(target[key], deepFreeze(newData));
        });
      } else {
        return update(deepMerge(data, deepFreeze(newData)));
      }
    };

    var splice = function splice(fullPath, start, deleteCount) {
      for (var _len = arguments.length, elements = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        elements[_key - 3] = arguments[_key];
      }

      cache.spliceArray(fullPath, start, deleteCount, elements.length);

      return modifyAt(fullPath, function (target, key) {
        var arr = target[key];
        if (!Array.isArray(arr)) throw new Error('can\'t splice a non array');
        var updated = arr.slice(0);
        var result = updated.splice.apply(updated, [start, deleteCount].concat(elements));
        target[key] = deepFreeze(updated);
        return result;
      });
    };

    // we create a local cursor class w/ access to mutable reference to data

    var Cursor = (function (_module$exports$Cursor) {
      function Cursor() {
        var path = arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, Cursor);

        _get(Object.getPrototypeOf(Cursor.prototype), 'constructor', this).call(this);
        this.path = path;
      }

      _inherits(Cursor, _module$exports$Cursor);

      _createClass(Cursor, [{
        key: 'cursor',
        value: (function (_cursor) {
          function cursor() {
            return _cursor.apply(this, arguments);
          }

          cursor.toString = function () {
            return _cursor.toString();
          };

          return cursor;
        })(function () {
          var path = arguments[0] === undefined ? [] : arguments[0];

          var fullPath = this.path.concat(path);
          var cached = cache.get(fullPath);
          if (cached != null) {
            return cached;
          }
          var cursor = new Cursor(fullPath);
          cache.store(cursor);
          return cursor;
        })
      }, {
        key: 'get',
        value: function get() {
          var path = arguments[0] === undefined ? [] : arguments[0];

          var target = data;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this.path.concat(path)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var key = _step2.value;

              target = target[key];
              if (target == null) return undefined;
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          return target;
        }
      }, {
        key: 'set',
        value: (function (_set) {
          function set(_x, _x2) {
            return _set.apply(this, arguments);
          }

          set.toString = function () {
            return _set.toString();
          };

          return set;
        })(function (path, value) {
          if (arguments.length === 1) {
            value = path;
            path = [];
          }
          var fullPath = this.path.concat(path);
          recordChange('set', [fullPath, value]);
          return set(fullPath, value);
        })
      }, {
        key: 'delete',
        value: function _delete() {
          var path = arguments[0] === undefined ? [] : arguments[0];

          var fullPath = this.path.concat(path);
          recordChange('delete', [fullPath]);
          return del(fullPath);
        }
      }, {
        key: 'merge',
        value: (function (_merge) {
          function merge(_x3) {
            return _merge.apply(this, arguments);
          }

          merge.toString = function () {
            return _merge.toString();
          };

          return merge;
        })(function (newData) {
          var fullPath = this.path;
          recordChange('merge', [fullPath, newData]);
          return merge(fullPath, newData);
        })
      }, {
        key: 'splice',
        value: (function (_splice) {
          function splice(_x4, _x5, _x6, _x7) {
            return _splice.apply(this, arguments);
          }

          splice.toString = function () {
            return _splice.toString();
          };

          return splice;
        })(function (path, start, deleteCount) {
          for (var _len2 = arguments.length, elements = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
            elements[_key2 - 3] = arguments[_key2];
          }

          var fullPath = this.path.concat(path);
          recordChange('splice', [fullPath, start, deleteCount].concat(elements));
          return splice.apply(undefined, [fullPath, start, deleteCount].concat(elements));
        })
      }, {
        key: 'push',
        value: function push(path, value) {
          return this.splice(path, Infinity, 0, value);
        }
      }, {
        key: 'pop',
        value: function pop(path) {
          return this.splice(path, -1, 1)[0];
        }
      }, {
        key: 'unshift',
        value: function unshift(path, value) {
          return this.splice(path, 0, 0, value);
        }
      }, {
        key: 'shift',
        value: function shift(path) {
          return this.splice(path, 0, 1)[0];
        }
      }, {
        key: 'bind',
        value: function bind(path, pre) {
          var _this = this;

          return function (v) {
            _this.set(path, pre ? pre(v) : v);
          };
        }
      }, {
        key: 'has',
        value: function has(path) {
          return this.get(path) != null;
        }
      }]);

      return Cursor;
    })(module.exports.Cursor);

    // perform callback one time to start

    onChange(new Cursor(), []);

    // return a 'handle' to the cursor instance

    return {
      data: (function (_data) {
        function data() {
          return _data.apply(this, arguments);
        }

        data.toString = function () {
          return _data.toString();
        };

        return data;
      })(function () {
        return data;
      }),
      cache: (function (_cache) {
        function cache() {
          return _cache.apply(this, arguments);
        }

        cache.toString = function () {
          return _cache.toString();
        };

        return cache;
      })(function () {
        return cache;
      }),
      pending: (function (_pending) {
        function pending() {
          return _pending.apply(this, arguments);
        }

        pending.toString = function () {
          return _pending.toString();
        };

        return pending;
      })(function () {
        return pending;
      }),
      changes: (function (_changes) {
        function changes() {
          return _changes.apply(this, arguments);
        }

        changes.toString = function () {
          return _changes.toString();
        };

        return changes;
      })(function () {
        return changes;
      }),
      cursor: function cursor(path) {
        return new Cursor(path);
      },
      set: set,
      'delete': del,
      merge: merge,
      splice: splice
    };
  }

};

},{"./cursor_cache":2,"./deep_freeze":3,"./deep_merge":4}],2:[function(require,module,exports){
'use strict';

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// this is used to cache cursors so that two cursors to the same object will be
// referrentially equal.

var cursorSymbol = Symbol();

// define some functions to perform operations on either an Array or Map object

function get(target, key) {
  if (target instanceof Map) {
    return target.get(key);
  } else {
    return target[key];
  }
}

function set(target, key, value) {
  if (target instanceof Map) target.set(key, value);else target[key] = value;

  return value;
}

function del(target, key) {
  if (target instanceof Map) target['delete'](key);else target[key] = undefined;

  return true;
}

function empty(target) {
  if (target instanceof Map) {
    return target.size === 0;
  } else {
    return target.length === 0 && target[cursorSymbol] == null;
  }
}

// recursively clear changes along a path, pruning nodes as stack unwinds
// return the last node along the path

function clearPath(node, key, parent, path) {
  if (node == null) {
    return;
  }var result = undefined;
  del(node, cursorSymbol);

  if (path.length > 0) {
    var nextKey = path[0];
    var nextNode = get(node, nextKey);
    result = clearPath(nextNode, nextKey, node, path.slice(1));
  } else {
    result = node;
  }

  if (parent != null && empty(node)) {
    del(parent, key);
  }

  return result;
}

// recursively clear all paths on an object

function clearObject(node, changes) {
  del(node, cursorSymbol);
  for (var k in changes) {
    var next = get(node, k);
    if (next != null) {
      clearObject(next, changes[k]);
      if (empty(next)) del(node, k);
    }
  }
}

// recursively count nodes in the cache tree

function size(node) {
  if (node == null) {
    return 0;
  }if (node instanceof Map) {
    var result = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = node[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var key = _step$value[0];
        var value = _step$value[1];

        if (key !== cursorSymbol) {
          result += size(value);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result + node.size + (node.has(cursorSymbol) ? -1 : 0);
  } else {
    return node.reduce(function (memo, child) {
      return child != null ? memo + 1 + size(child) : memo;
    }, 0);
  }
}

// the cursor cache class

module.exports = (function () {
  function CursorCache(data) {
    _classCallCheck(this, CursorCache);

    this.data = data;
    this.root = new Map();
  }

  _createClass(CursorCache, [{
    key: 'reset',
    value: function reset() {
      this.root = new Map();
    }
  }, {
    key: 'get',
    value: (function (_get) {
      function get(_x) {
        return _get.apply(this, arguments);
      }

      get.toString = function () {
        return _get.toString();
      };

      return get;
    })(function (path) {
      var target = this.root;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = path[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          target = get(target, key);
          if (target == null) return undefined;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return get(target, cursorSymbol);
    })
  }, {
    key: 'store',
    value: function store(cursor) {
      var target = this.root;
      var dataTarget = this.data();
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = cursor.path[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var key = _step3.value;

          dataTarget = dataTarget == null ? null : dataTarget[key];
          var next = get(target, key);
          if (next == null) {
            next = Array.isArray(dataTarget) ? [] : new Map();
            set(target, key, next);
          }
          target = next;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3['return']) {
            _iterator3['return']();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      set(target, cursorSymbol, cursor);
    }
  }, {
    key: 'clearPath',
    value: (function (_clearPath) {
      function clearPath(_x2) {
        return _clearPath.apply(this, arguments);
      }

      clearPath.toString = function () {
        return _clearPath.toString();
      };

      return clearPath;
    })(function (path) {
      return clearPath(this.root, null, null, path);
    })
  }, {
    key: 'clearObject',
    value: (function (_clearObject) {
      function clearObject(_x3, _x4) {
        return _clearObject.apply(this, arguments);
      }

      clearObject.toString = function () {
        return _clearObject.toString();
      };

      return clearObject;
    })(function (path, obj) {
      var target = this.clearPath(path);
      if (target == null) return;

      clearObject(target, obj);
    })
  }, {
    key: 'spliceArray',
    value: function spliceArray(path, start, deleteCount, addCount) {
      var target = this.clearPath(path);
      if (target == null) {
        return;
      }if (!Array.isArray(target)) {
        throw new Error('CursorCache attempted spliceArray on non array');
      }

      target.splice.apply(target, [start, deleteCount].concat(_toConsumableArray(new Array(addCount))));
    }
  }, {
    key: 'size',
    value: (function (_size) {
      function size() {
        return _size.apply(this, arguments);
      }

      size.toString = function () {
        return _size.toString();
      };

      return size;
    })(function () {
      return size(this.root);
    })
  }]);

  return CursorCache;
})();

},{}],3:[function(require,module,exports){
// recursively call Object.freeze on an object and its keyerties

'use strict';

module.exports = function deepFreeze(object) {

  if (!object instanceof Object) {
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

},{}],4:[function(require,module,exports){
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

},{}]},{},[1]);
