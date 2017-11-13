/* eslint-env mocha */
const assert = require("assert");
const redis = require("../../../src/db/redis/datastore.js");
const simple = require("simple-mock");

describe("REDIS", ()=>{
  before("mock", ()=>{
    redis.initdb(["get", "del", "set", "sadd", "srem", "hmset", "hgetall", "hdel", "smembers", "flushall"]
    .reduce((obj, el)=>{
      return Object.assign(obj, {[el]: simple.stub().callbackWith(null, "ok")});
    }, {}));
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
