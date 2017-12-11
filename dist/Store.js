(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Store = factory());
}(this, (function () { 'use strict';

/**
 * 不知道对象结构时取值时,一般会采用 obj&&obj[0]&&obj.name的方法,等价于下面的方法
 *  f(obj,'[0].name') === f(obj,['0','name'])
 * @param {取值的对象} obj 
 * @param {用于取值的字符串或者数组} path 
    var testData = { a: [{ c: { b: [233] } }] };
    safeGet(testData,'a[0].c.b[0]') => 233
    safeGet(testData,['a','0','c','b','0']) => 233
 */
function safeGet(obj, path) {
  if (Array.isArray(path)) {
    return path.reduce(function (ob, k) {
      return ob && ob[k] ? ob[k] : undefined;
    }, obj);
  } else if (typeof path == "string") {
    var arrKeys = path.split("."),
        keys = [],
        m;
    arrKeys.forEach(function (k) {
      if (m = k.match(/([^\[\]]+)|(\[\d+\])/g)) {
        // arr[3][2] =>  ['arr',[3],[2]]
        m = m.map(function (v) {
          return v.replace(/\[(\d+)\]/, "$1");
        });
        // ['arr',[3],[2]] => ['arr','3','2']
        [].push.apply(keys, m);
      }
    });
    return safeGet(obj, keys);
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

/**
 * @param {处理的对象} obj 
 * @param {路径:数组或者字符串} path 
 * @param {设置的值} val 
 * @param {当键值为正数字时,生成数组覆盖} toArray 
 * var obj1={a:1};
 * safeSet(obj1,'b.c[1]',2)  => {a:1,b:{c:{"1":2}}}
 * safeSet(obj1,'b.c[1]',2,true)  => {a:1,b:{c:[,2]}}
 * 
 * var obj2={};
 * safeSet(obj2,'1','wtf')  => {"1":'wtf'}
 * safeSet(obj2,'1','wtf',true)  => {1:'wtf'} // 只有当取的key值的父级(obj2)不为对象时,并且newArrayIfNeed==true 才会新建数组
 * 
 * var obj3=2;
 * safeSet(obj2,'1','wtf')  => {"1":'wtf'}
 * safeSet(obj2,'1','wtf',true)  => ["1":'wtf']
 * 
 * 思路:
 * obj表示对象  k:表示key  result:需要赋值的值
 * * 判断能否取值 obj    (代码A)
 *      * 能取值
 *              * obj[k]是否存在 
 *                    * 存在       
 *                          *  obj[k]不是引用对象   
 *                                * 是否是最后一个key
 *                                      * 是,obj[k]=result
 *                                      * 不是
 *                                          *根据下一个key值和newArrayIfNeed  obj[k]={}或[] 重复A
 *                          *  obj[k]是引用对象   下一个key?ob=obj[k]并重复A: obj[k]=result                 
 *                    * 不存在
 *                          *  是否是最后一个key
 *                                      * 是,obj[k]=result
 *                                      * 不是
 *                                          *根据下一个key值和newArrayIfNeed  obj[k]={}或[] 重复A=result 
 *      * 不能取值   (代码B)
 *             * 根据key值和newArrayIfNeed  obj[k]={}或[]  下一个key?ob=obj[k]并重复A: obj[k]=result 
 * 
 */
function _newObjectOrArray(key, newArrayIfNeed) {
  if (newArrayIfNeed && parseInt(key) == key && /^(([1-9]\d*)|0)$/.test(key)) {
    return new Array(parseInt(key)); //  因为new Array("1") => ["1"] ,所以需要parseInt处理一下   
  } else {
    return {};
  }
}

function safeSet(data, path, result, newArrayIfNeed) {
  if (Array.isArray(path)) {
    var ob = data,
        ArrayObj = [],
        key,
        val;
    for (var i = 0, len = path.length; i <= len - 1; i++) {
      key = path[i];
      if ((typeof ob === "undefined" ? "undefined" : _typeof(ob)) == "object" && ob != null) {
        ArrayObj.push(ob);
        val = ob[key];
        if (val && (typeof val === "undefined" ? "undefined" : _typeof(val)) == "object") {
          if (i == len - 1) {
            ob[key] = result;
          }
        } else {
          if (i == len - 1) {
            ob[key] = result;
          } else {
            ob[key] = _newObjectOrArray(path[i + 1], newArrayIfNeed);
          }
        }
      } else {
        // (代码B)
        ob = _newObjectOrArray(key, newArrayIfNeed);
        ArrayObj.push(ob);
        if (i == len - 1) {
          ob[key] = result;
        } else {
          ob[key] = _newObjectOrArray(path[i + 1], newArrayIfNeed);
        }
      }
      ob = ob[key];
    }
    return ArrayObj[0];
  } else if (typeof path == "string") {
    // 解析path为数组    list[2].user.[3]  =>  ['list','2','user',3]
    var splitArr = path.split("."),
        pathKeyArr = [],
        k;
    splitArr.forEach(function (key) {
      if (k = key.match(/([^\[\]]+)|(\[\d+\])/g)) {
        // list[2]  => ['list','[2]']
        k = k.map(function (v) {
          return v.replace(/\[(\d+)\]/, "$1");
        }); // [2] => 2  
        [].push.apply(pathKeyArr, k);
      }
    });
    return safeSet(data, pathKeyArr, result, newArrayIfNeed);
  }
}

var noop = function noop() {};
var defaultOptions = {
    debug: false,
    Storage: "localStorage",
    exp: 31536000000, // 默认超时100年
    serialize: function serialize(data) {
        return JSON.stringify(data);
    },
    deserialize: function deserialize(data) {
        return data && JSON.parse(data);
    },

    parseToArray: true,
    polyfill: { // 不支持localStorage时,可以通过实现以下函数来进行polyfill
        setItem: noop,
        removeItem: noop,
        getAllStorage: noop
    }
    /**
     * Store构造函数
     * @param {Object} opts 
     */
};var Store = function Store(opts) {
    var that = this;
    if (!(this instanceof Store)) {
        throw new TypeError("Failed to construct 'Store': Please use the 'new' operator, this object construc" + "tor cannot be called as a function.");
    }
    this.opts = _extend(defaultOptions, opts);
    this.setItem = _setFunction("setItem");
    this.removeItem = _setFunction("removeItem");
    this.getAllStorage = _setFunction("getAllStorage");

    function _setFunction(funcName) {
        var polyFn = that.opts.polyfill[funcName];
        if (polyFn === noop) {
            if (funcName == "getAllStorage") {
                return function () {
                    return window[that.opts.Storage];
                };
            } else {
                return window[that.opts.Storage][funcName];
            }
        } else if (isFunction(polyFn)) {
            //如果要在不支持localStorage的环境中使用,可自行实现opts.polyfill[funcName]
            return polyFn;
        } else {
            throw new TypeError('Polyfill ' + funcName + ' should be a function');
        }
    }
};

function isFunction() {
    return typeof fn === 'function';
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
        var key = '__' + Math.round(Math.random() * 1e7);
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
    if ((typeof allStorage === 'undefined' ? 'undefined' : _typeof(allStorage)) === 'object' && "__start__" in allStorage && "__end__" in allStorage && "__data__" in allStorage) {
        return true;
    } else {
        return false;
    }
}

/**
 * 新建一个用于存储Storage的对象
 */
function initLegalStruct() {
    return {
        __start__: undefined,
        __data__: undefined,
        __end__: undefined
    };
}

function wrapper(fn, action) {
    console.log(this);
    var args = [].slice.call(arguments, 2),
        result,
        storage,
        key;
    result = fn.apply(this, args);
    if (this.opts.debug) {
        storage = _extend({}, this.getAllStorage());
        for (var i in storage) {
            if (storage.hasOwnProperty(i)) {
                key = this.opts.deserialize(storage[i]);
                if (isLegalStruct(key)) {
                    storage[i] = {
                        __start: new Date(key.__start__).toUTCString(),
                        __end__: new Date(key.__end__).toUTCString(),
                        __data__: key.__data__
                    };
                } else {
                    delete storage[i];
                }
            }
        }
        console.log(action + "(" + (args[0] ? '"' + args[0] + '"' : "") + (args[1] ? ", " + this.opts.serialize(args[1]) : "") + (args[2] ? ", " + JSON.stringify(args[2]) : "") + ")", "\n   =>  ", storage);
    }
    return result;
}

function _set(key, val, opts) {
    var opts = _extend(this.opts, opts),
        allStorage = this.getAllStorage(),
        firstKey = key.split(".")[0],
        parsedData = this.opts.deserialize(allStorage[firstKey]),
        nowTimeStamp = +new Date(),
        expiresTime = nowTimeStamp + opts.exp * 100;
    if (!isLegalStruct(parsedData)) {
        parsedData = initLegalStruct();
    }
    this.setItem.call(window[this.opts.Storage], firstKey, opts.serialize({
        __start__: nowTimeStamp,
        __end__: expiresTime,
        __data__: safeSet(parsedData.__data__, key, val, this.opts.parseToArray)
    }));
}

function _get(key) {
    var allStorage = this.getAllStorage(),
        firstKey = key.split(".")[0],
        parsedData = this.opts.deserialize(allStorage[firstKey]);
    if (isLegalStruct(parsedData)) {
        if (+new Date() >= parsedData.__end__) {
            // 取值时如果已过期,则会删除
            this.remove(firstKey);
        } else {
            return safeGet(parsedData.__data__, key);
        }
    }
}

function _remove(key) {
    this.removeItem.call(window[this.opts.Storage], key);
}

function _clearAllExpires() {
    var allStorage = this.getAllStorage(),
        nowTimeStamp = +new Date(),
        parsedData;
    for (var key in allStorage) {
        if (allStorage.hasOwnProperty(key)) {
            parsedData = this.opts.deserialize(allStorage[key]);
            if (isLegalStruct(parsedData)) {
                if (nowTimeStamp >= parsedData.__end__) {
                    this.removeItem.call(window[this.opts.Storage], key);
                }
            }
        }
    }
}

Store.prototype = {
    constructor: Store,
    get: function get$$1() {
        return wrapper.call.apply(wrapper, [this, _get, 'get'].concat(Array.prototype.slice.call(arguments)));
    },
    set: function set$$1() {
        return wrapper.call.apply(wrapper, [this, _set, "set"].concat(Array.prototype.slice.call(arguments)));
    },
    remove: function remove() {
        return wrapper.call.apply(wrapper, [this, _remove, "remove"].concat(Array.prototype.slice.call(arguments)));
    },
    clearAllExpires: function clearAllExpires() {
        return wrapper.call.apply(wrapper, [this, _clearAllExpires, "clearAllExpires"].concat(Array.prototype.slice.call(arguments)));
    },
    isSupported: function isSupported() {
        return _isStorageSupported(window[this.opts.Storage]);
    }
};

return Store;

})));
