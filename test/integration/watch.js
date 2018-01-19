/* eslint-env mocha */
const assert = require("assert");
const watch = require("../../src/event-handlers/messages/watch.js");
const redis = require("../../src/db/redis/datastore.js");
const filePath = "messaging-service-test-bucket/non-existent-test-file.txt";
const displayConnections = require("../../src/event-handlers/display-connections");
const validFilePath = filePath.replace("non-existent-", "");
const displayId = "fakeId";
const version = "fakeVersion";
const simple = require("simple-mock");
const gcs = require("../../src/gcs.js");
const {fileMetadata: md, watchList} = require("../../src/db/api.js");

describe("WATCH : Integration", ()=>{
  before(()=>{
    return redis.eraseEntireDb();
  });

  afterEach(()=>{simple.restore();});

  it("adds a watchlist entry", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch.doOnIncomingPod({displayId, filePath, version})
    .then(redis.getHash.bind(null, `watch:${displayId}`))
    .then((reply)=>{
      assert.deepEqual(reply, {
        [filePath]: version
      });
    });
  });

  it("adds display to file metadata", ()=>{
    simple.mock(md, "getFileVersion").resolveWith("existing-file-metadata-version");

    return watch.doOnIncomingPod({displayId, filePath, version})
    .then(redis.getSet.bind(null, `meta:${filePath}:displays`))
    .then((reply)=>{
      assert.equal(reply, displayId);
    });
  });

  it("returns error if invalid filePath requested", ()=>{
    const notFound = 404;
    simple.mock(displayConnections, "sendMessage");

    return watch.doOnIncomingPod({displayId, filePath, version})
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

  describe("Folders", ()=>{
    it("saves a new folder, on subsequent call returns existing data without gcs fetch", ()=>{ // eslint-disable-line max-statements
      const folderPath = "messaging-service-test-bucket/test-folder/"
      const filePath1 = "messaging-service-test-bucket/test-folder/test-file-for-update.txt";
      const filePath2 = "messaging-service-test-bucket/test-folder/test-file.txt";
      const fileVersion = "1509655894026319";

      simple.mock(gcs, "getFiles");
      simple.mock(md, "addDisplayToMany");
      simple.mock(md, "setMultipleFileVersions");
      simple.mock(watchList, "putFolderData");

      return watch({displayId, filePath: folderPath})
      .then((reply)=>{
        assert(gcs.getFiles.called);
        assert(md.setMultipleFileVersions.called);
        assert(md.addDisplayToMany.called);
        assert(watchList.putFolderData.called);
        verifyReply(reply);
      })
      .then(()=>{
        return watch({displayId: "someOtherDisplay", filePath: folderPath})
      })
      .then((reply)=>{
        assert.equal(gcs.getFiles.callCount, 1);
        assert.equal(md.setMultipleFileVersions.callCount, 1);
        assert.equal(md.addDisplayToMany.callCount, 2); // eslint-disable-line no-magic-numbers
        assert.equal(watchList.putFolderData.callCount, 2); // eslint-disable-line no-magic-numbers
        verifyReply(reply);
      });

      function verifyReply(reply) {
        console.log(reply);
        assert.equal(reply.msg, "ok");
        assert.equal(reply.topic, "watch-result");
        assert.equal(reply.folderData.length, 2); // eslint-disable-line no-magic-numbers
        assert(reply.folderData.some(entry=>entry.filePath.includes(filePath1)));
        assert(reply.folderData.some(entry=>entry.filePath.includes(filePath2)));
        assert(reply.folderData.some(entry=>entry.version.includes(fileVersion)));
        assert(reply.folderData.some(entry=>!entry.version.includes(fileVersion)));
        assert(reply.folderData.some(entry=>entry.token.data.filePath.includes(filePath1)));
        assert(reply.folderData.some(entry=>entry.token.data.filePath.includes(filePath2)));
      }
    });
  });
});
