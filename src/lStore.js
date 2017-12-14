import safeGet from './safeGet';
import safeSet from './safeSet';
var noop = function () {};
/**
 * Store构造函数
 * @param {Object} opts 
 */
var Store = function (opts) {
    var that = this;
    var defaultOptions = {
        namespace: "",
        debug: false,
        storage: "localStorage",
        exp: 31536000000,
        serialize(data) { // 默认超时100年
            return JSON.stringify(data);
        },
        deserialize(data) {
            return data && JSON.parse(data);
        },
        parseToArray: true
    };
    if (!(this instanceof Store)) {
        throw new TypeError("Store should be used as Failed to construct 'lStore': Please use the 'new' operator, this object construc" +
            "tor cannot be called as a function.");
    }
    this.opts = _extend(defaultOptions, opts);
}

function isFunction() {
    return typeof fn === 'function';
}

function _extend(obj, props) {
    for (var key in props)
        obj[key] = props[key];
    return obj;
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
    if (typeof allStorage === 'object' && "__start__" in allStorage && "__end__" in allStorage && "__data__" in allStorage) {
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
    var args = [].slice.call(arguments, 2),
        result,
        storage,
        key;
    result = fn.apply(this, args);
    if (this.opts.debug) {
        storage = _extend({}, window[this.opts.storage]);
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

function _set(key, val, options) {
    var opts = this.opts;
    if (options && options.exp) { // 仅支持设置exp
        opts.exp = options.exp;
    }
    var allStorage = window[opts.storage],
        key = opts.namespace ? "__namespace__" + opts.namespace + "." + key : key,
        firstKey = key.split(".")[0],
        parsedData = opts.deserialize(allStorage[firstKey]),
        nowTimeStamp = +new Date(),
        expiresTime = nowTimeStamp + opts.exp * 100;
    if (!isLegalStruct(parsedData)) {
        parsedData = initLegalStruct();
    }
    window[opts.storage].setItem(
        firstKey,
        opts.serialize({
            __start__: nowTimeStamp,
            __end__: expiresTime,
            __data__: safeSet(parsedData.__data__, key, val, opts.parseToArray)
        })
    );
}

function _get(key) {
    var allStorage = window[this.opts.storage],
        originKey = key,
        key = this.opts.namespace ? "__namespace__" + this.opts.namespace + "." + key : key,
        firstKey = key.split(".")[0],
        parsedData = this.opts.deserialize(allStorage[firstKey]);
    if (isLegalStruct(parsedData)) {
        if (+new Date() >= parsedData.__end__) {
            // 取值时如果已过期,则会删除
            this.remove(this.opts.namespace ? originKey : firstKey);
        } else {
            return safeGet(parsedData.__data__, key);
        }
    }
}

function _remove(key) {
    if (this.opts.namespace) {
        _set.call(this, key, "");
    } else {
        window[this.opts.storage].removeItem(key);
    }
}

function _clearAllExpires() {
    var allStorage = window[this.opts.storage],
        nowTimeStamp = +new Date(),
        parsedData;
    for (var key in allStorage) {
        if (allStorage.hasOwnProperty(key)) {
            parsedData = this.opts.deserialize(allStorage[key]);
            if (isLegalStruct(parsedData)) {
                if (nowTimeStamp >= parsedData.__end__) {
                    this.removeItem.call(window[this.opts.storage], key);
                }
            }
        }
    }
}

Store.prototype = {
    constructor: Store,
    get() {
        return wrapper.call(this, _get, 'get', ...arguments)
    },
    set() {
        return wrapper.call(this, _set, "set", ...arguments);
    },
    remove() {
        return wrapper.call(this, _remove, "remove", ...arguments);
    },
    clearAllExpires() {
        return wrapper.call(this, _clearAllExpires, "clearAllExpires", ...arguments);
    },
    isSupported() {
        return _isStorageSupported(window[this.opts.storage])
    }
}
export default Store;