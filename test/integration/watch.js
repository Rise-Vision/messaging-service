/* eslint-env mocha */
const assert = require("assert");
const watch = require("../../src/event-handlers/messages/watch.js");
const redis = require("../../src/db/redis/datastore.js");
const displayConnections = require("../../src/event-handlers/display-connections");
const simple = require("simple-mock");
const gcs = require("../../src/gcs.js");
const {fileMetadata: md} = require("../../src/db/api.js");

describe("WATCH : Integration", ()=>{
  const displayId = "fakeId";
  const version = "fakeVersion";
  const invalidFilePath = "messaging-service-test-bucket/non-existent-test-file.txt";
  const validFilePath = invalidFilePath.replace("non-existent-", "");

  before(()=>{
    return redis.eraseEntireDb();
  });

  afterEach(()=>{simple.restore();});

  it("adds a watchlist entry", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch.doOnIncomingPod({displayId, filePath: invalidFilePath, version})
    .then(redis.getHash.bind(null, `watch:${displayId}`))
    .then((reply)=>{
      assert.deepEqual(reply, {
        [invalidFilePath]: version
      });
    });
  });

  it("adds display to file metadata", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch.doOnIncomingPod({displayId, filePath: invalidFilePath, version})
    .then(redis.getSet.bind(null, `meta:${invalidFilePath}:displays`))
    .then((reply)=>{
      assert.equal(reply, displayId);
    });
  });

  it("returns error if invalid filePath requested", ()=>{
    const notFound = 404;
    simple.mock(displayConnections, "sendMessage");

    return watch.doOnIncomingPod({displayId, filePath: invalidFilePath, version})
    .then(()=>{
      const response = displayConnections.sendMessage.lastCall.args[1];
      assert.equal(response.error, notFound);
    })
  });

  describe("filePath exists on GCS but not present in file metadata db", ()=>{
    it("returns a token and version and saves version in file metadata", ()=>{
      const knownGCSversion = "1509652220691132";
      simple.mock(gcs, "version");
      simple.mock(displayConnections, "sendMessage");

      return redis.getString(`meta:${validFilePath}:version`)
      .then((resp)=>assert(!resp))
      .then(watch.doOnIncomingPod.bind(null, {displayId, filePath: validFilePath, version}))
      .then(()=>{
        const reply = displayConnections.sendMessage.lastCall.args[1];
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
      simple.mock(displayConnections, "sendMessage");

      return redis.setString(`meta:${validFilePath}:version`, knownGCSversion)
      .then(watch.doOnIncomingPod.bind(null, {
        displayId,
        filePath: validFilePath,
        version: knownGCSversion
      }))
      .then(()=>{
        const reply = displayConnections.sendMessage.lastCall.args[1];
        console.log(reply);
        assert(!reply.token);
        assert.equal(reply.msg, "ok");
        assert.equal(reply.version, knownGCSversion);
        assert(!gcs.version.called);
      });
    });
  });
});
