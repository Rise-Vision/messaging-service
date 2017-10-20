/* eslint-env mocha */
const assert = require("assert");
const watch = require("../../messages/watch.js");
const redis = require("../../db/redis/datastore.js");
const filePath = "testBucket/testObject";
const displayId = "fakeId";
const version = "fakeVersion";

describe("REDIS : Integration", ()=>{
  before(()=>{
    redis.initdb();
    return redis.eraseEntireDb();
  });

  after(()=>{
    redis.ungracefulQuit();
  });

  it("adds a watchlist entry", ()=>{
    watch({displayId, filePath, version});

    return redis.getHash(`watch:${displayId}`)
    .then((reply)=>{
      assert.deepEqual(reply, {
        [filePath]: version
      });
    });
  });

  it("adds display to file metadata", ()=>{
    watch({displayId, filePath, version});

    return redis.getSet(`meta:${filePath}:displays`)
    .then((reply)=>{
      assert.equal(reply, displayId);
    });
  });
});

