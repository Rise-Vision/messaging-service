/* eslint-env mocha */
const assert = require("assert");
const displayConnections = require("../../src/event-handlers/display-connections");
const folderWatch = require("../../src/event-handlers/messages/folder-watch.js");
const redis = require("../../src/db/redis/datastore.js");
const simple = require("simple-mock");
const gcs = require("../../src/gcs.js");
const {folders, fileMetadata: md, watchList} = require("../../src/db/api.js");

describe("FOLDER-WATCH : Integration", ()=>{
  const folderPath = "messaging-service-test-bucket/test-folder/"
  const filePath1 = "messaging-service-test-bucket/test-folder/test-file-for-update.txt";
  const filePath2 = "messaging-service-test-bucket/test-folder/test-file.txt";
  const fileVersion = "1509655894026319";
  const displayId = "test-display-id";

  before(()=>{
    return redis.eraseEntireDb();
  });

  afterEach(()=>{simple.restore();});

  it("saves a new folder, on subsequent call returns existing data without gcs fetch", ()=>{ // eslint-disable-line max-statements
    simple.mock(gcs, "getFiles");
    simple.mock(md, "addDisplayToMany");
    simple.mock(md, "setMultipleFileVersions");
    simple.mock(watchList, "putFolderData");
    simple.mock(displayConnections, "sendMessage");
    simple.mock(folders, "addFileNames");
    simple.mock(folders, "filePathsAndVersionsFor");

    return folderWatch.doOnIncomingPod({displayId, filePath: folderPath})
    .then(()=>{
      assert(gcs.getFiles.called);
      assert(md.setMultipleFileVersions.called);
      assert(md.addDisplayToMany.called);
      assert(watchList.putFolderData.called);
      assert(folders.addFileNames.called);
      verifyReply(displayId, 1);
    })
    .then(()=>{
      return folderWatch.doOnIncomingPod({displayId: "someOtherDisplay", filePath: folderPath})
    })
    .then(()=>{
      assert.equal(folders.addFileNames.callCount, 1);
      assert.equal(folders.filePathsAndVersionsFor.callCount, 1);
      assert.equal(gcs.getFiles.callCount, 1);
      assert.equal(md.setMultipleFileVersions.callCount, 1);
      assert.equal(md.addDisplayToMany.callCount, 2); // eslint-disable-line no-magic-numbers
      assert.equal(watchList.putFolderData.callCount, 2); // eslint-disable-line no-magic-numbers
      verifyReply("someOtherDisplay", 2); // eslint-disable-line no-magic-numbers
    });

    function verifyReply(id, replyCount) {
      const [repliedTo, reply] = displayConnections.sendMessage.lastCall.args;
      console.log(reply);

      assert.equal(displayConnections.sendMessage.callCount, replyCount);
      assert.equal(repliedTo, id);
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

