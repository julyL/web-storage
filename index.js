import safeGet from "l-safeget";
import safeSet from "l-safeset";
var noop = function () {};
/**
 * Store构造函数
 * @param {Object} opts
 */
function Store(opts) {
    var that = this;
    var defaultOptions = {
        storage: "localStorage",
        exp: 31536000,
        serialize(data) {
            // 默认超时100年
            return JSON.stringify(data);
        },
        deserialize(data) {
            return data && JSON.parse(data);
        }
    };
    if (!(this instanceof Store)) {
        throw new TypeError(
            "Store should be used as Failed to construct 'lStore': Please use the 'new' operator, this object construc" +
            "tor cannot be called as a function."
        );
    }
    this.opts = _extend(defaultOptions, opts);
};

function isFunction() {
    return typeof fn === "function";
}

function _extend(obj, props) {
    for (var key in props) obj[key] = props[key];
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
    if (
        typeof allStorage === "object" &&
        "__start__" in allStorage &&
        "__end__" in allStorage &&
        "__data__" in allStorage
    ) {
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
        exp: (options && options.exp)||this.opts.exp
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
        __data__: safeSet(parsedData.__data__, key, val)
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
            return safeGet(parsedData.__data__, key);
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
    get() {
        return _get.call(this, ...arguments);
    },
    set() {
        return _set.call(this, ...arguments);
    },
    remove() {
        return _remove.call(this, ...arguments);
    },
    clearAllExpires() {
        return _clearAllExpires.call(this, ...arguments);
    },
    isSupported() {
        return _isStorageSupported(window[this.opts.storage]);
    }
};

export default Store;