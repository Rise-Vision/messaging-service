/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const watch = require("../../messages/watch.js");
const db = require("../../db/api.js");

describe("WATCH", ()=>{
  beforeEach(()=>{
    simple.mock(db.fileMetadata, "addDisplayTo").returnWith(true);
    simple.mock(db.watchList, "put").returnWith(true);
  });

  afterEach(()=>{
    simple.restore();
  });

  it("throws on invalid watch entry", ()=>{
    const [displayId, filePath] = Array.from({length: 2}, ()=>"test");
    const errmsg = /invalid watchlist entry/;

    assert.throws(watch, errmsg);
    assert.throws(watch.bind(null, {displayId}, errmsg));
    assert.throws(watch.bind(null, {displayId, filePath}, errmsg));
  });

  it("accepts valid watch entry", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");

    assert(watch({displayId, filePath, version}));
  });

  it("saves file metadata", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");

    watch({displayId, filePath, version});
    assert(db.fileMetadata.addDisplayTo.called);
  });

  it("saves watchlist entries", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");

    watch({displayId, filePath, version});
    assert(db.watchList.put.called);
  });
});
