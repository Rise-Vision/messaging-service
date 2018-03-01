/* eslint-env mocha */
const assert = require("assert");
const rp = require("request-promise-native");
const testPort = 9228;
const simple = require("simple-mock");
const db = require("../../src/db/api");

describe("Webhooks : Presence : POST", ()=>{
  const testIds = ["ABCD", "EFGH"];

  beforeEach(()=>{
    simple.mock(db.connections, "getPresence").resolveWith(testIds);
  });

  afterEach(()=>{
    simple.restore();
  });

  it("expects an array of ids", ()=>{
    return rp({
      method: "POST",
      uri: `http://localhost:${testPort}/messaging/presence`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("expected application/json, POST, [ids]"));
    });
  });

  it("expects an array of ids", ()=>{
    return rp({
      method: "POST",
      body: testIds,
      uri: `http://localhost:${testPort}/messaging/presence`,
      json: true
    })
    .then(resp=>{
      assert.deepEqual(resp, testIds);
    });
  });
});
