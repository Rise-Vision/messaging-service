/* eslint-env mocha */
const assert = require("assert");
const {version, init} = require("../../src/version-compare/gcs.js");

describe("GCS", ()=>{
  before(()=>{
    init();
  });

  it("throws on invalid params", ()=>{
    assert.throws(version.bind(null, ""), /params/);
    assert.throws(version.bind(null, "test-bucket-missing-file"), /params/);
    assert.throws(version.bind(null, "test-bucket-missing-file/"), /params/);
  });

  it("retrieves generation", ()=>{
    const filePath = "messaging-service-test-bucket/test-folder/test-file.txt";
    const expectedVersion = "1509655894026319";

    return version(filePath)
    .then((result)=>{
      assert.equal(result, expectedVersion);
    });
  });
});
