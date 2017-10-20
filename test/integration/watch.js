/* eslint-env mocha */
const assert = require("assert");
const watch = require("../../messages/watch.js");
const redis = require("../../db/redis/datastore.js");
const sha1 = {
  "testDownloadFilePath": "21651c84690890030f63bb655171985f84da8d43"
};

describe("REDIS : Integration", ()=>{
  before(()=>{
    redis.initdb();
    return redis.eraseEntireDb();
  });

  after(()=>{
    redis.ungracefulQuit();
  });

  it("adds a watchlist entry", ()=>{
    watch({
      displayId: "fakeId",
      filePath: sha1.testDownloadFilePath,
      version: "fakeVer"
    });

    return redis.getHash("watch:fakeId")
    .then((reply)=>{
      assert.deepEqual(reply, {
        [sha1.testDownloadFilePath]: "fakeVer"
      });
    });
  });

  it("adds display to file metadata", ()=>{
    watch({
      displayId: "fakeId",
      filePath: "testDownloadFilePath",
      version: "fakeVer"
    });

    return redis.getSet(`meta:${sha1.testDownloadFilePath}:displays`)
    .then((reply)=>{
      assert.equal(reply, "fakeId");
    });
  });
});

