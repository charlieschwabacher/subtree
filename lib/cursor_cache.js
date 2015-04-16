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