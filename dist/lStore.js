(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.lStore = factory());
}(this, (function () { 'use strict';

var lSafeget = function safeGet(obj, path) {
    if (Array.isArray(path)) {
        return path.reduce((ob, k) => {
            return ob && ob[k] !== undefined ? ob[k] : undefined;
        }, obj);
    } else if (typeof path == "string") {
        var arrKeys = path.split("."),
            pathKeys = [],
            m;
        arrKeys.forEach(k => {
            if ((m = k.match(/([^\[\]]+)|(\[\d+\])/g))) { // arr[3][2] =>  ['arr',[3],[2]]
                m = m.map(v => v.replace(/\[(\d+)\]/, "$1")); // ['arr',[3],[2]] => ['arr','3','2']
                [].push.apply(pathKeys, m);
            }
        });
        return safeGet(obj, pathKeys);
    }
};

/**
 * @param {Object} obj
 * @param {String|Array} path
 * @param {*} val
 */
var lSafeset = function safeSet(obj, path, result) {
    if (Array.isArray(path)) {
        var ob = obj,
            cachedObj = [], // 用于存储每个obj每个取值之后的值(除最后一个,其他值必定为引用值{}或[]) 从而cachedObj[0]即为修改之后的值
            key,
            val;
        for (var i = 0, len = path.length; i <= len - 1; i++) {
            key = String(path[i]).replace(/^\[(([1-9]\d*)|0)\]$/,'$1');  // [1] => 1
            if (typeof ob == "object" && ob != null) {
                cachedObj.push(ob);
                val = ob[key];
                if (i == len - 1) {
                    ob[key] = result;
                } else if (!val || typeof val != "object") {
                    ob[key] = createObjectOrArray(path, i + 1);
                }
            } else {
                ob = createObjectOrArray(path,i);
                cachedObj.push(ob);
                if (i == len - 1) {
                    ob[key] = result;
                } else {
                    ob[key] = createObjectOrArray(path, i + 1);
                }
            }
            ob = ob[key];
        }
        return cachedObj[0];
    } else if (typeof path == "string") {
        // list.2.user.[3]  =>  ['list','2','user',[3]]
        var keys = path.split("."),
            pathKeys = [],
            m;
        keys.forEach(key => {
            if ((m = key.match(/([^\[\]]+)|(\[\d+\])/g))) {
                //  list[2] => ['list','[2]']
                [].push.apply(pathKeys, m);
            }
        });
        return safeSet(obj, pathKeys, result);
    }
};

function createObjectOrArray(path, key) {
    var m, num;
    if (m = String(path[key]).match(/^\[(([1-9]\d*)|0)\]$/)) {
        num = parseInt(m[1]);
        return new Array(num);  // new Array("1") => ["1"] 
    } else {
        return {};
    }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

function Store(opts) {
    var defaultOptions = {
        storage: "localStorage",
        exp: 31536000,
        serialize: function serialize(data) {
            // 默认超时100年
            return JSON.stringify(data);
        },
        deserialize: function deserialize(data) {
            return data && JSON.parse(data);
        }
    };
    if (!(this instanceof Store)) {
        throw new TypeError("Store should be used as Failed to construct 'lStore': Please use the 'new' operator, this object construc" + "tor cannot be called as a function.");
    }
    this.opts = _extend(defaultOptions, opts);
}

function _extend(obj, props) {
    for (var key in props) {
        obj[key] = props[key];
    }return obj;
}

/**
 * 判断当前环境是否支持Storage(只支持判断localStorage和sessionStorage)
 * @param {Object} storage
 */
function _isStorageSupported(storage) {
    var supported = false;
    if (storage && storage.setItem) {
        supported = true;
        var key = "__" + Math.round(Math.random() * 1e7);
        try {
            storage.setItem(key, key);
            storage.removeItem(key);
        } catch (err) {
            supported = false;
        }
    }
    return supported;
}
/**
 * 判断从storage中的数据是否符合我们定义的格式
 * @param {Object} allStorage
 */
function isLegalStruct(allStorage) {
    if ((typeof allStorage === "undefined" ? "undefined" : _typeof(allStorage)) === "object" && "__start__" in allStorage && "__end__" in allStorage && "__data__" in allStorage) {
        return true;
    } else {
        return false;
    }
}

/**
 * 新建一个用于存储Storage的对象
 */
function initStruct() {
    return {
        __start__: undefined,
        __data__: undefined,
        __end__: undefined
    };
}

function formatDate(date) {
    return new Date(date).toUTCString();
}

function _set(key, val, options) {
    var opts = _extend(this.opts, {
        exp: options && options.exp || this.opts.exp
    });
    // debugger;
    var allStorage = window[opts.storage],
        storageKey = key.split(".")[0].split("[")[0],
        parsedData = opts.deserialize(allStorage[storageKey]),
        nowTimeStamp = +new Date(),
        expiresTime = nowTimeStamp + opts.exp * 1000;
    if (!isLegalStruct(parsedData)) {
        parsedData = initStruct();
    }
    window[opts.storage].setItem(storageKey, opts.serialize({
        __start__: formatDate(nowTimeStamp),
        __end__: formatDate(expiresTime),
        __data__: lSafeset(parsedData.__data__, key, val)
    }));
}

function _get(key) {
    var allStorage = window[this.opts.storage],
        storageKey = key.split(".")[0].split("[")[0],
        parsedData = this.opts.deserialize(allStorage[storageKey]);
    if (isLegalStruct(parsedData)) {
        if (+new Date() >= +new Date(parsedData.__end__)) {
            // 取值时如果已过期,则会删除
            this.remove(storageKey);
        } else {
            return lSafeget(parsedData.__data__, key);
        }
    }
}

function _remove(key) {
    window[this.opts.storage].removeItem(key);
}

function _clearAllExpires() {
    var allStorage = window[this.opts.storage],
        nowTimeStamp = +new Date(),
        parsedData;
    for (var key in allStorage) {
        if (allStorage.hasOwnProperty(key)) {
            parsedData = this.opts.deserialize(allStorage[key]);
            if (isLegalStruct(parsedData)) {
                if (nowTimeStamp >= +new Date(parsedData.__end__)) {
                    window[this.opts.storage].removeItem(key);
                }
            }
        }
    }
}

Store.prototype = {
    constructor: Store,
    get: function get$$1() {
        return _get.call.apply(_get, [this].concat(Array.prototype.slice.call(arguments)));
    },
    set: function set$$1() {
        return _set.call.apply(_set, [this].concat(Array.prototype.slice.call(arguments)));
    },
    remove: function remove() {
        return _remove.call.apply(_remove, [this].concat(Array.prototype.slice.call(arguments)));
    },
    clearAllExpires: function clearAllExpires() {
        return _clearAllExpires.call.apply(_clearAllExpires, [this].concat(Array.prototype.slice.call(arguments)));
    },
    isSupported: function isSupported() {
        return _isStorageSupported(window[this.opts.storage]);
    }
};

return Store;

})));
