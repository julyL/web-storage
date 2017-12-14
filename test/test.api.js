var storage = window.localStorage,
    lstore;

function stringify(obj) {
    return JSON.stringify(obj);
}

function clearStorage() {
    storage.clear();
}

function eq(obj1, obj2) {
    debugger;
    expect(stringify(obj1)).to.equal(stringify(obj2));
}
describe('lStore', function () {
    'use strict';
    describe('set and get', function () {
        clearStorage();
        lstore = new lStore();
        describe('set(a.b,{ age:24})', function () {
            lstore.set("a.b", {
                age: 24
            });
            it('get(a) === { b: {age:24}}', function () {
                eq(lstore.get("a"), {
                    b: {
                        age: 24
                    }
                });
            })
            describe('set(a.c.1,{ name:july})', function () {
                lstore.set("a.b.c", {
                    name: "july"
                });
                it('get(a) === { b: { age : 24 },c :{ 1: {name:july}}}', function () {
                    eq(lstore.get("a"), {
                        b: {
                            age: 24
                        },
                        c: {
                            1: {
                                name: "july"
                            }
                        }
                    });
                })
            })
        })
    });
});