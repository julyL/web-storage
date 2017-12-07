import safeGet from './safeGet';
import safeSet from './safeSet';
var noop = function () {},
    isSupported = _isStorageSupported(localStorage),
    defaultOptions = {
        Storage: "localStorage",
        exp: 3153600000, // 默认超时100年
        serialize(data) {
            return JSON.stringify(data);
        },
        deserialize(data) {
            return data && JSON.parse(data);
        },
        parseToArray: true,
        polyfill: { // 不支持localStorage时,可以通过实现以下函数来进行polyfill
            setItem: noop,
            removeItem: noop,
            getAllStorage: noop
        }
    }
/**
 * Store构造函数
 * @param {Object} opts 
 */
var Store = function (opts) {
    var that = this;
    if (!(this instanceof Store)) {
        throw new TypeError("Failed to construct 'Store': Please use the 'new' operator, this object construc" +
            "tor cannot be called as a function.");
    }
    this.opts = _extend(defaultOptions, opts);
    this.setItem = _setFunction("setItem");
    this.removeItem = _setFunction("removeItem");
    this.getAllStorage = _setFunction("getAllStorage");

    function _setFunction(funcName) {
        var polyFn = that.opts.polyfill[funcName];
        if (polyFn === noop) {
            if (funcName == "getAllStorage") {
                return () => window[that.opts.Storage];
            } else {
                return window[that.opts.Storage][funcName];
            }
        } else if (isFunction(polyFn)) {
            //如果要在不支持localStorage的环境中使用,可自行实现opts.polyfill[funcName]
            return polyFn;
        } else {
            throw new TypeError(`Polyfill ${funcName} should be a function`);
        }
    }
}

function isFunction() {
    return typeof fn === 'function';
}

function _extend(obj, props) {
    for (var key in props)
        obj[key] = props[key];
    return obj;
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

function initLegalStruct() {
    return {
        __start__: undefined,
        __data__: undefined,
        __end__: undefined
    };
}

Store.prototype = {
    constructor: Store,
    get(key) {
        var allStorage = this.getAllStorage(),
            firstKey = key.split(".")[0],
            parsedData = this.opts.deserialize(allStorage[firstKey]);
        if (isLegalStruct(parsedData)) {
            if (+new Date() >= parsedData.__end__) {
                // 已过期
                this.remove(firstKey);
            } else {
                return safeGet(parsedData.__data__, key);
            }
        }
    },
    set(key, val, opts) {
        var opts = _extend(this.opts, opts),
            allStorage = this.getAllStorage(),
            firstKey = key.split(".")[0],
            parsedData = this.opts.deserialize(allStorage[firstKey]),
            nowTimeStamp = +new Date(),
            expiresTime = nowTimeStamp + opts.exp * 1000,
            resultData;
        if (!isLegalStruct(parsedData)) {
            parsedData = initLegalStruct();
        }
        resultData = safeSet(parsedData.__data__, key, val, this.opts.parseToArray);
        this.setItem.call(window[this.opts.Storage], firstKey, opts.serialize({
            __start__: nowTimeStamp,
            __end__: expiresTime,
            __data__: resultData
        }))
    },
    remove(key) {
        this.removeItem.call(window[this.opts.Storage], key);
    },
    isSupported,
    clearAllExpires() {
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
}
export default Store;