/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const watch = require("../../src/messages/watch.js");
const versionCompare = require("../../src/version-compare/api.js");
const db = require("../../src/db/api.js");

describe("WATCH", ()=>{
  beforeEach(()=>{
    simple.mock(db.fileMetadata, "addDisplayTo").returnWith(true);
    simple.mock(db.watchList, "put").returnWith(true);
    simple.mock(versionCompare, "compare").resolveWith({matched: true});
  });

  afterEach(()=>{
    simple.restore();
  });

  it("returns error msg on invalid watch entry", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");
    const errmsg = resp=>assert(resp.msg.startsWith(`invalid watchlist entry`));

    return Promise.all([
      watch().then(errmsg),
      watch({displayId}).then(errmsg),
      watch({displayId, filePath}).then(errmsg),
      watch({displayId, filePath, version}).then(errmsg)
    ]);
  });

  it("saves file metadata", ()=>{
    const displayId = "test";
    const filePath = "bucket/object";
    const version = "test";

    return watch({displayId, filePath, version})
    .then(()=>assert(db.fileMetadata.addDisplayTo.called))
  });

  it("saves watchlist entries", ()=>{
    const displayId = "test";
    const filePath = "bucket/object";
    const version = "test";

    return watch({displayId, filePath, version})
    .then(()=>assert(db.watchList.put.called));
  });
});
