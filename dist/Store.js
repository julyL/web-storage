(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Store = factory());
}(this, (function () { 'use strict';

var lodashGet = require('lodash.get');
var lodashSet = require('lodash.Set');
var noop = function noop() {};
var isSupported = _isStorageSupported(localStorage);
var defaultOptions = {
    Storage: "localStorage",
    exp: 315360000000, // 默认超时10000年
    serialize: function serialize(data) {
        return JSON.stringify(data);
    },
    deserialize: function deserialize(data) {
        return data && JSON.parse(data);
    },

    polyfill: { // 不支持localStorage时,可以通过实现以下函数来进行polyfill
        getItem: noop,
        setItem: noop,
        removeItem: noop,
        getAllStorage: noop
    }
};

var Store = function Store(opts) {
    var that = this;
    if (!(this instanceof Store)) {
        throw new TypeError("Failed to construct 'Store': Please use the 'new' operator, this object construc" + "tor cannot be called as a function.");
    }
    this.opts = _extend(defaultOptions, opts);

    this.setItem = _setFunction("setItem");
    this.getItem = _setFunction("getItem");
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

function isLegalStruct(data) {
    if ("__start__" in storageData && "__end__" in storageData && "__data__" in storageData) {
        return true;
    } else {
        return false;
    }
}

Store.prototype = {
    constructor: Store,
    get: function get(key) {
        var storageData = this.getAllStorage(),
            firstKey = key.split(".")[0],
            parsedData = this.opts.deserialize(storageData[firstKey]);
        if (isLegalStruct(parsedData)) {
            if (+new Date() >= parsedData.__end__) {
                // 已过期
                this.remove(firstKey);
            } else {
                return lodashGet(parsedData.__data__, key);
            }
        }
    },
    set: function set(key, val, opts) {
        var opts = _extend(this.opts, opts),
            storageData = this.getAllStorage(),
            firstKey = key.split(".")[0],
            nowTimeStamp = +new Date(),
            expiresTime = nowTimeStamp + parseFloat(opts.exp);
        this.setItem(firstKey, opts.serialize({
            __start__: nowTimeStamp,
            __end__: expiresTime,
            __data__: lodashSet(this.opts.deserialize, key, val)
        }));
    },
    remove: function remove(key) {
        this.removeItem(key);
    },

    isSupported: isSupported,
    clearAllExpires: function clearAllExpires() {
        var storageData = this.getAllStorage(),
            nowTimeStamp = +new Date();
        for (var key in storageData) {
            if (isLegalStruct(storageData[key])) {
                if (nowTimeStamp >= storageData[key].__end__) {
                    this.removeItem(key);
                }
            }
        }
    }
};

return Store;

})));
