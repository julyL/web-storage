var expect = chai.expect;
var lstore = new lStore({});
localStorage.clear();

describe("set/get value  by path like `a.b.c`", function () {

    it('set("a.b", { c: 1 }) => { a: b: { c:1 }}', function () {
        lstore.set("a.b", {
            c: 1
        });
        console.log(localStorage);
        expect(lstore.get("a.b.c")).to.be.equal(1);
    });

    it('set("d[0].1.[1]", { c: 1 }) => {"d":[{"1":[null,{"c":1}]}]}', function () {
        lstore.set("d[0].1.[1]", {
            c: 1
        });
        console.log(localStorage);
        expect(lstore.get("d[0].1.[1].c")).to.be.equal(1);
    });

    it("set expire time 3s", function() {
      lstore.set("e", 0, { exp: 3 });
      console.log(localStorage);
      expect(lstore.get("e")).to.be.equal(0);
    });

    it("3s later, get expire value will remove value and return undefined", function() {
      setTimeout(function() {
        expect(lstore.get("e")).to.be.equal(undefined);
        console.log(localStorage);
      }, 3000);
    });

    it("clearAllExpires value after 3s", function() {
      lstore.set("f.1", 0, { exp: 2 });
      lstore.set("g[0].e", {a:1}, { exp: 2 });
      expect(lstore.get("f.1")).to.be.equal(0);
      expect(lstore.get("g[0].e").a).to.be.equal(1);
      console.log("before clear",localStorage);
      setTimeout(function(){
          lstore.clearAllExpires();
          expect(lstore.get("f")).to.be.equal(undefined);
          expect(lstore.get("g")).to.be.equal(undefined);
          console.log("after clear", localStorage);
      },3000)
    });

    it("remove data after 5s", function() {
        setTimeout(function() {
            lstore.remove("a");
            lstore.remove("d");
            expect(lstore.get("a")).to.be.equal(undefined);
            expect(lstore.get("d")).to.be.equal(undefined);
            console.log("after remove:", localStorage);
        }, 5000);
    });
});