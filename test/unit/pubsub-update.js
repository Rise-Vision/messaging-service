/* eslint-env mocha */
const assert = require("assert");
const psUpdate = require("../../src/pubsub/pubsub-update.js");
const simple = require("simple-mock");
const db = require("../../src/db/api.js");
const displayConnections = require("../../src/messages/display-connections.js");
const logger = require("../../src/logger.js");

describe("Pub/sub Update", ()=>{
  const testIncomingADDMessage = JSON.stringify({
    filePath: "my-bucket/my-file",
    version: "12345",
    type: "ADD",
    podname: "test-pod"
  });

  const watchers = ["d1", "d2"];

  beforeEach(()=>{
    simple.mock(db.fileMetadata, "getWatchersFor").resolveWith(watchers);
    simple.mock(db.fileMetadata, "setFileVersion").resolveWith();
    simple.mock(db.fileMetadata, "deleteMetadata").resolveWith();
    simple.mock(db.watchList, "removeEntry").resolveWith();
    simple.mock(db.watchList, "updateVersion").resolveWith();
    simple.mock(displayConnections, "sendMessage").returnWith();
    simple.mock(logger, "log").returnWith();
  });

  afterEach(()=>{
    simple.restore();
  });

  it("doesn't change db or notify displays if there are no watchers for the filepath", ()=>{
    simple.restore(db.fileMetadata, "getWatchersFor");
    simple.mock(db.fileMetadata, "getWatchersFor").resolveWith([]);

    return psUpdate.processUpdate(testIncomingADDMessage)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert([
        db.fileMetadata.deleteMetadata.callCount,
        db.fileMetadata.setFileVersion.callCount,
        db.watchList.removeEntry.callCount,
        db.watchList.updateVersion.callCount,
        displayConnections.sendMessage.callCount
      ].every(callCount=>callCount === 0));
    });
  });

  it("notifies displays but doesn't change db if the data was shared from a different pod", ()=>{
    const otherPodMsg = testIncomingADDMessage.replace("test-pod", "other");

    return psUpdate.processUpdate(otherPodMsg)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert.equal(displayConnections.sendMessage.callCount, watchers.length);
      assert(displayConnections.sendMessage.lastCall.args[1].token);

      assert([
        db.fileMetadata.deleteMetadata.callCount,
        db.fileMetadata.setFileVersion.callCount,
        db.watchList.removeEntry.callCount,
        db.watchList.updateVersion.callCount
      ].every(callCount=>callCount === 0));
    });
  });

  it("updates db on DELETE", ()=>{
    const delPodMsg = testIncomingADDMessage.replace("ADD", "DELETE");

    return psUpdate.processUpdate(delPodMsg)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert.equal(db.fileMetadata.deleteMetadata.callCount, 1);
      assert.equal(db.watchList.removeEntry.callCount, 1);
      assert.equal(displayConnections.sendMessage.callCount, watchers.length);

      assert([
        db.fileMetadata.setFileVersion.callCount,
        db.watchList.updateVersion.callCount
      ].every(callCount=>callCount === 0));
    });
  });

  it("updates db on UPDATE", ()=>{
    const updMsg = testIncomingADDMessage.replace("ADD", "UPDATE");

    return psUpdate.processUpdate(updMsg)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert.equal(db.fileMetadata.setFileVersion.callCount, 1);
      assert.equal(db.watchList.updateVersion.callCount, 1);
      assert.equal(displayConnections.sendMessage.callCount, watchers.length);

      assert([
        db.fileMetadata.deleteMetadata.callCount,
        db.watchList.removeEntry.callCount
      ].every(callCount=>callCount === 0));
    });
  });

  it("updates db on ADD", ()=>{
    return psUpdate.processUpdate(testIncomingADDMessage)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert.equal(db.fileMetadata.setFileVersion.callCount, 1);
      assert.equal(db.watchList.updateVersion.callCount, 1);
      assert.equal(displayConnections.sendMessage.callCount, watchers.length);

      assert([
        db.fileMetadata.deleteMetadata.callCount,
        db.watchList.removeEntry.callCount
      ].every(callCount=>callCount === 0));
    });
  });

  it("doesn't update db or send messages if the type is invalid", ()=>{
    const invalidMsg = testIncomingADDMessage.replace("ADD", "INVALID");
    return psUpdate.processUpdate(invalidMsg)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert(logger.log.lastCall.arg, "Invalid notification type received");

      assert([
        db.fileMetadata.deleteMetadata.callCount,
        db.fileMetadata.setFileVersion.callCount,
        db.watchList.removeEntry.callCount,
        db.watchList.updateVersion.callCount,
        displayConnections.sendMessage.callCount
      ].every(callCount=>callCount === 0));
    });
  });
});

