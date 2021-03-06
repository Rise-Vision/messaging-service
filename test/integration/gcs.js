/* eslint-env mocha */
const simple = require("simple-mock");
const assert = require("assert");
const {version, init, getFiles} = require("../../src/gcs.js");
const googlePubSub = require("../../src/google-pubsub");

describe("GCS : Integration", ()=>{
  before(()=>{
    init();
  });

  beforeEach(()=>{
    simple.mock(googlePubSub, "publish").returnWith(Promise.resolve());
  });

  afterEach(()=>{
    simple.restore();
  });

  describe("Single file version", ()=>{
    it("throws on invalid params", ()=>{
      assert.throws(version.bind(null, ""), /params/);
      assert.throws(version.bind(null, "test-bucket-missing-file"), /params/);
      assert.throws(version.bind(null, "test-bucket-missing-file/"), /params/);
    });

    it("returns NOEXIST on trashed file", ()=>{
      const filePath = "messaging-service-test-bucket/trashed-file.txt";

      return version(filePath)
      .then(() => assert.fail("should have been rejected"))
      .catch(err=>{
        assert.equal(err.message, "NOEXIST");
      });
    });

    it("retrieves generation", ()=>{
      const filePath = "messaging-service-test-bucket/test-folder/test-file.txt";
      const expectedVersion = "1509655894026319";

      return version(filePath)
      .then((result)=>{
        assert.equal(result, expectedVersion);
      });
    });

    it("returns NOEXIST on 404", ()=>{
      const filePath = "messaging-service-test-bucket/nonexistent-file";

      return version(filePath)
      .then(() => assert.fail("should have been rejected"))
      .catch(err=>{
        assert.equal(err.message, "NOEXIST");
      });
    });
  });

  describe("Folder fetch", ()=>{

    it("retrieves a list of files from a folder", ()=>{
      return getFiles("messaging-service-test-bucket/test-folder/");
    });

    it("should not include trashed files in the list of files from a folder", ()=>{
      return getFiles("messaging-service-test-bucket/test-folder/")
      .then(files => {
        const trashed = files.find(file => file.name === 'test-folder/trashed-file.txt');
        assert.equal(trashed, undefined); // eslint-disable-line no-undefined
      });
    });

    it("expects subfolders to be each individually requested", ()=>{
      return getFiles("messaging-service-test-bucket/test-folder/")
      .then(files=>{
        assert(files.every(file=>!file.name.includes("test-sub-folder")));
      });
    });
  });
});
