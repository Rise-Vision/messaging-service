/* eslint-env mocha */
const displayConnections = require("../../src/event-handlers/display-connections");
const assert = require("assert");
const simple = require("simple-mock");
const folderWatch = require("../../src/event-handlers/messages/folder-watch.js");
const versionCompare = require("../../src/version-compare/api.js");
const db = require("../../src/db/api.js");
const gcs = require("../../src/gcs.js");

describe("WATCH (FOLDER)", ()=>{
  beforeEach(()=>{
    simple.mock(displayConnections, "sendMessage").returnWith(true);
    simple.mock(db.fileMetadata, "addDisplayTo").returnWith(true);
    simple.mock(db.fileMetadata, "addDisplayToMany").callFn(input=>Promise.resolve(input));
    simple.mock(db.fileMetadata, "setMultipleFileVersions").callFn(input=>Promise.resolve(input));
    simple.mock(db.watchList, "put").returnWith(true);
    simple.mock(db.watchList, "putFolder").callFn(input=>Promise.resolve(input));
    simple.mock(db.watchList, "lastChanged").resolveWith("123456");
    simple.mock(db.folders, "addFileNames").callFn((path, input)=>Promise.resolve(input));
    simple.mock(db.folders, "filePathsAndVersionsFor").returnWith([]);
    simple.mock(versionCompare, "compare").resolveWith({matched: true});
  });

  afterEach(()=>{
    simple.restore();
  });

  it("saves file metadata for folders", ()=>{
    simple.mock(db.folders, "watchingFolder").resolveWith(false);
    simple.mock(gcs, "getFiles").resolveWith([
      {
        name: "test-folder/test-file-1",
        generation: "12345"
      },
      {
        name: "test-folder/test-file-2",
        generation: "54321"
      }
    ]);
    const displayId = "test";
    const filePath = "bucket/test-folder/";

    return folderWatch.doOnIncomingPod({displayId, filePath})
    .then(()=>{
      assert(db.fileMetadata.addDisplayToMany.called);
      assert(db.watchList.putFolder.called);
      assert(db.watchList.lastChanged.called);

      assert.equal(displayConnections.sendMessage.callCount, 1);
      assert.equal(displayConnections.sendMessage.lastCall.args[0], displayId);

      const message = displayConnections.sendMessage.lastCall.args[1];
      assert(message);
      assert.equal(message.msg, "ok");
      assert.equal(message.topic, "watch-result");
      assert.equal(message.watchlistLastChanged, "123456");
    })
  });

  it("returns existing folder data", ()=>{
    simple.mock(db.folders, "watchingFolder").resolveWith(true);
    const displayId = "test";
    const filePath = "bucket/test-folder/";

    return folderWatch.doOnIncomingPod({displayId, filePath})
    .then(()=>assert(db.folders.filePathsAndVersionsFor.called))
  });
});
