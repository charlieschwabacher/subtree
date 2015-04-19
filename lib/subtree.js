'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var deepFreeze = require('./deep_freeze');
var deepMerge = require('./deep_merge');
var CursorCache = require('./cursor_cache');

module.exports = {

  // make a cursor superclass accessible for type checking

  Cursor: (function () {
    var _class = function Cursor() {
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
        key: 'has',
        value: function has(path) {
          return this.get(path) != null;
        }
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
          if (arguments.length === 1) {
            value = path;
            path = [];
          }

          return this.splice(path, Infinity, 0, value);
        }
      }, {
        key: 'pop',
        value: function pop() {
          var path = arguments[0] === undefined ? [] : arguments[0];

          return this.splice(path, -1, 1)[0];
        }
      }, {
        key: 'unshift',
        value: function unshift(path, value) {
          if (arguments.length === 1) {
            value = path;
            path = [];
          }

          return this.splice(path, 0, 0, value);
        }
      }, {
        key: 'shift',
        value: function shift() {
          var path = arguments[0] === undefined ? [] : arguments[0];

          return this.splice(path, 0, 1)[0];
        }
      }, {
        key: 'bind',
        value: function bind(path, pre) {
          var _this = this;

          if (arguments.length === 1) {
            path = [];
            pre = path;
          }

          return function (v) {
            _this.set(path, pre ? pre(v) : v);
          };
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