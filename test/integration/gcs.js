/* eslint-env mocha */
const assert = require("assert");
const {version, init, getFiles} = require("../../src/gcs.js");

describe("GCS : Integration", ()=>{
  before(()=>{
    init();
  });

  describe("Single file version", ()=>{
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

    it("Returns version 0 on 404", ()=>{
      const filePath = "messaging-service-test-bucket/nonexistent-file";

      return version(filePath).then(ver=>{
        assert.equal(ver, "0");
      });
    });
  });

  describe("Folder fetch", ()=>{
    it("retrieves a list of files from a folder", ()=>{
      return getFiles("messaging-service-test-bucket/test-folder/");
    });
    it("expects subfolders to be each individually requested", ()=>{
      return getFiles("messaging-service-test-bucket/test-folder/")
      .then(files=>{
        assert(files.every(file=>!file.name.includes("test-sub-folder")));
      });
    });
  });
});
