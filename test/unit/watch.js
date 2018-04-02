/* eslint-env mocha */
const displayConnections = require("../../src/event-handlers/display-connections");
const assert = require("assert");
const simple = require("simple-mock");
const watch = require("../../src/event-handlers/messages/watch.js");
const versionCompare = require("../../src/version-compare/api.js");
const db = require("../../src/db/api.js");

describe("WATCH", ()=>{
  beforeEach(()=>{
    simple.mock(displayConnections, "sendMessage").returnWith(true);
    simple.mock(db.fileMetadata, "addDisplayTo").returnWith(true);
    simple.mock(db.fileMetadata, "addDisplayToMany").returnWith(true);
    simple.mock(db.fileMetadata, "setMultipleFileVersions").resolveWith(true);
    simple.mock(db.watchList, "put").returnWith(true);
    simple.mock(db.watchList, "putFolder").returnWith(true);
    simple.mock(db.watchList, "lastChanged").resolveWith("123456");
    simple.mock(db.folders, "addFileNames").returnWith([]);
    simple.mock(db.folders, "filePathsAndVersionsFor").returnWith([]);
    simple.mock(versionCompare, "compare").resolveWith({matched: true});
  });

  afterEach(()=>{
    simple.restore();
  });

  it("sends error msg on invalid watch entry", ()=>{
    const [displayId, filePath, version] = Array.from({length: 3}, ()=>"test");
    const receivedError = ()=>{
      return displayConnections.sendMessage.lastCall.args[1].msg.startsWith("invalid");
    };

    watch.doOnIncomingPod({displayId});
    assert(receivedError());
    watch.doOnIncomingPod({displayId, filePath});
    assert(receivedError());
    watch.doOnIncomingPod({displayId, filePath, version});
  });

  it("saves file metadata", ()=>{
    const displayId = "test";
    const filePath = "bucket/object";
    const version = "test";

    return watch.doOnIncomingPod({displayId, filePath, version})
    .then(()=>assert(db.fileMetadata.addDisplayTo.called))
  });

  it("saves watchlist entries", ()=>{
    const displayId = "test";
    const filePath = "bucket/object";
    const version = "test";

    return watch.doOnIncomingPod({displayId, filePath, version})
    .then(()=>assert(db.watchList.put.called));
  });

  it("sends WATCH-RESULT message", ()=>{
    const displayId = "test";
    const filePath = "bucket/object";
    const version = "test";

    return watch.doOnIncomingPod({displayId, filePath, version})
    .then(() =>{
      assert.equal(displayConnections.sendMessage.callCount, 1);
      assert.equal(displayConnections.sendMessage.lastCall.args[0], displayId);

      const message = displayConnections.sendMessage.lastCall.args[1];
      assert.equal(message.msg, "ok");
      assert.equal(message.topic, "watch-result");
      assert.equal(message.filePath, filePath);
      assert.equal(message.watchlistLastChanged, "123456");
    });
  });
});
