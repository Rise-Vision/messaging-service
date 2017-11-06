/* eslint-env mocha */
const makeToken = require("../../token/make-token.js");
const assert = require("assert");
const sha1hexLength = 40;

describe("Make Token", ()=>{
  it("throws unless an object with displayId and filePath fields is passed", ()=>{
    assert.throws(makeToken.bind(null), /invalid params/);
    assert.throws(makeToken.bind(null, "", ""), /invalid params/);
    assert.throws(makeToken.bind(null, {filePath: "0"}), /invalid params/);
    assert.throws(makeToken.bind(null, {displayId: "0"}), /invalid params/);
    assert.ok(makeToken({displayId: "0", filePath: "0"}));
  });

  it("provides an MS TOKEN for a display id and filepath", ()=>{
    const timestamp = Date.now();
    const filePath = "testBucket/testFile";
    const displayId = "testId";

    const resp = makeToken({displayId, filePath});

    assert.equal(resp.token.data.filePath, filePath);
    assert.equal(resp.token.data.displayId, displayId);
    assert(Number.isInteger(resp.token.data.timestamp) && resp.token.data.timestamp >= timestamp);
    assert.equal(resp.token.hash.length, sha1hexLength);
  });
});

