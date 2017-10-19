/* eslint-env mocha */
const assert = require("assert");
const redis = require("../../db/redis/datastore.js");
const simple = require("simple-mock");

describe("REDIS", ()=>{
  before("mock", ()=>{
    redis.initdb({
      hmset: simple.stub().callbackWith(null, "ok"),
      sadd: simple.stub().callbackWith(null, "ok")
    });
  });

  after("reset", ()=>{
    redis.initdb({});
  });

  it("adds a watchlist entry", ()=>{
    assert(redis.patchHash());
  });

  it("adds values to a set", ()=>{
    assert(redis.setAdd("mykey", ["val1", "val2"]));
  });

  it("updates a file metadata entry", ()=>{
    redis.patchHash();
  });
});
