const assert = require("assert");
const simple = require("simple-mock");
const watch = require("../messages/watch.js");

describe("WATCH", ()=>{
  it("throws on invalid watch entry", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");
    const errmsg = /invalid watchlist entry/;

    assert.throws(watch.watch, errmsg);
    assert.throws(watch.watch.bind({displayId}, errmsg));
    assert.throws(watch.watch.bind({displayId, filePath}, errmsg));
  });

  it("accepts valid watch entry", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");

    assert(watch.watch({displayId, filePath, version}));
  })
});
