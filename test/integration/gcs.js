/* eslint-env mocha */
const assert = require("assert");
const {version, init} = require("../../src/version-compare/gcs.js");

describe("GCS : Integration", ()=>{
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

  it("throws on 404", ()=>{
    const NOT_FOUND = 404;
    const filePath = "messaging-service-test-bucket/nonexistent-file";

    return version(filePath)
    .then(()=>Promise.reject(Error("Should not have resolved here")))
    .catch(err=>{
      if (err.message.startsWith("Should not have")) {throw Error("Fail");}
      assert.equal(err.code, NOT_FOUND);
    });
  });
});
