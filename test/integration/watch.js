/* eslint-env mocha */
const assert = require("assert");
const watch = require("../../src/messages/watch.js");
const redis = require("../../src/db/redis/datastore.js");
const filePath = "messaging-service-test-bucket/non-existent-test-file.txt";
const validFilePath = filePath.replace("non-existent-", "");
const displayId = "fakeId";
const version = "fakeVersion";
const simple = require("simple-mock");
const gcs = require("../../src/version-compare/gcs.js");
const {fileMetadata: md} = require("../../src/db/api.js");

describe("WATCH : Integration", ()=>{
  before(()=>{
    redis.initdb();
    gcs.init();
    return redis.eraseEntireDb();
  });

  after(()=>{
    redis.ungracefulQuit();
  });

  afterEach(()=>{simple.restore();});

  it("adds a watchlist entry", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch({displayId, filePath, version})
    .then(redis.getHash.bind(null, `watch:${displayId}`))
    .then((reply)=>{
      assert.deepEqual(reply, {
        [filePath]: version
      });
    });
  });

  it("adds display to file metadata", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch({displayId, filePath, version})
    .then(redis.getSet.bind(null, `meta:${filePath}:displays`))
    .then((reply)=>{
      assert.equal(reply, displayId);
    });
  });

  it("returns error if invalid filePath requested", ()=>{
    const notFound = 404;

    return watch({displayId, filePath, version})
    .then((reply)=>{
      assert.equal(reply.error, notFound);
    })
  });

  describe("filePath exists on GCS but not present in file metadata db", ()=>{
    it("returns a token and version and saves version in file metadata", ()=>{
      const knownGCSversion = "1509652220691132";
      simple.mock(gcs, "version");

      return redis.getString(`meta:${validFilePath}:version`)
      .then((resp)=>assert(!resp))
      .then(watch.bind(null, {displayId, filePath: validFilePath, version}))
      .then((reply)=>{
        assert.equal(reply.token.data.displayId, displayId);
        assert.ok(reply.token.hash);
        assert.ok(reply.token.data.timestamp);
        assert.equal(reply.version, knownGCSversion);
        assert(gcs.version.called);
        return redis.getString(`meta:${validFilePath}:version`)
        .then(string=>knownGCSversion === string)
      })
    });
  });

  describe("filePath is present in file metadata db and version matches", ()=>{
    it("does not return a token and does not query GCS", ()=>{
      const knownGCSversion = "1509652220691132";
      simple.mock(gcs, "version");

      return redis.setString(`meta:${validFilePath}:version`, knownGCSversion)
      .then(watch.bind(null, {displayId, filePath: validFilePath, version: knownGCSversion}))
      .then((reply)=>{
        console.log(reply);
        assert(!reply.token);
        assert.equal(reply.msg, "ok");
        assert.equal(reply.version, knownGCSversion);
        assert(!gcs.version.called);
      });
    });
  });
});
