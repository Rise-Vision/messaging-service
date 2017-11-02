/* eslint-env mocha */
const crypto = require("../../token/crypto.js");
const assert = require("assert");
const sha1len = 40

describe("Crypto", ()=>{
  it("encrypts then hashes as a signature for a js object", ()=>{
    const testObj = {
      one: 1,
      two: 2
    };

    assert.equal(crypto.encryptAndHash(testObj).length, sha1len);
  });
});
