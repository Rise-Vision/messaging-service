/* eslint-env mocha */
const assert = require("assert");
const redis = require("../../src/db/redis/datastore");
const fileUpdateHandler = require("../../src/event-handlers/messages/gcs-file-update");
const simple = require("simple-mock");
const db = require("../../src/db/api");
const displayConnections = require("../../src/event-handlers/display-connections");
const logger = require("../../src/logger");

describe("Pub/sub Update", ()=>{
  const testIncomingADDMessage = {
    filePath: "my-bucket/my-file",
    version: "12345",
    type: "ADD",
    podname: "test-pod"
  };

  const watchers = ["d1", "d2"];

  before(() => {
    redis.initdb(["get", "del", "set", "sadd", "srem", "hmset", "hgetall", "hdel", "hexists", "smembers", "flushall", "sismember", "exists", "sunion", "scard"]
    .reduce((obj, el)=>{
      return Object.assign(obj, {[el]: simple.stub().callbackWith(null, "ok")});
    }, {
      multi() {return {exec(cb) {cb(false, "OK")}}}
    }));
  });

  beforeEach(()=>{
    simple.mock(db.fileMetadata, "getWatchersFor").resolveWith(watchers);
    simple.mock(db.fileMetadata, "setFileVersion").resolveWith();
    simple.mock(db.fileMetadata, "deleteMetadata").resolveWith();
    simple.mock(db.watchList, "updateVersion").resolveWith();
    simple.mock(displayConnections, "sendMessage").returnWith();
    simple.mock(logger, "log").returnWith();
  });

  afterEach(()=>{
    simple.restore();
  });

  it("returns immediately if there is no metadata for the file", ()=>{
    simple.mock(db.fileMetadata, "hasMetadata").resolveWith(false);
    simple.mock(db.folders, "addFileToFolder").callFn(input=>input);
    return fileUpdateHandler.doOnIncomingPod(testIncomingADDMessage)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 0);
      assert.equal(db.fileMetadata.deleteMetadata.callCount, 0);
      assert.equal(db.fileMetadata.setFileVersion.callCount, 0);
      assert.equal(db.watchList.updateVersion.callCount, 0);
      assert.equal(displayConnections.sendMessage.callCount, 0);
    });
  });

  it("doesn't notify displays if there are no watchers for the filepath", ()=>{
    simple.mock(db.fileMetadata, "hasMetadata").resolveWith(true);
    simple.restore(db.fileMetadata, "getWatchersFor");
    simple.mock(db.fileMetadata, "getWatchersFor").resolveWith([]);

    return fileUpdateHandler.doOnIncomingPod(testIncomingADDMessage)
    .then(()=>{
      assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
      assert.equal(db.fileMetadata.deleteMetadata.callCount, 0);
      assert.equal(displayConnections.sendMessage.callCount, 0);
    });
  });

  it("notifies displays but doesn't change db if the data was shared from a different pod", ()=>{
    const otherPodMsg = {
      ...testIncomingADDMessage,
      podname: "other",
      watchers
    };

    simple.mock(db.fileMetadata, "hasMetadata").resolveWith(true);
    simple.mock(db.watchList, "lastChanged").callFn(displayId =>
      Promise.resolve(Number(displayId.substring(1))));
    simple.mock(displayConnections, "hasSparkFor").returnWith(true);

    return fileUpdateHandler.doOnAllPods(otherPodMsg)
    .then(() => {
      assert.equal(displayConnections.sendMessage.callCount, watchers.length);
      assert(displayConnections.sendMessage.lastCall.args[1].token);

      displayConnections.sendMessage.calls.forEach(call => {
        const displayNumber = Number(call.args[0].substring(1));
        const message = call.args[1];

        assert.equal(message.topic, "MSFILEUPDATE");
        assert.equal(message.filePath, "my-bucket/my-file");
        assert.equal(message.version, "12345");
        assert.equal(message.type, "ADD");
        assert(message.token);
        assert.equal(message.watchlistLastChanged, displayNumber);
      });

      assert.equal(db.fileMetadata.deleteMetadata.callCount, 0);
      assert.equal(db.fileMetadata.setFileVersion.callCount, 0);
      assert.equal(db.watchList.updateVersion.callCount, 0);
    });
  });

  describe("Updates db", ()=>{
    let lastChangedMap = {};

    beforeEach(() => {
      simple.mock(db.watchList, "updateLastChanged").callFn(displayId =>
        Promise.resolve(lastChangedMap[displayId] = Math.random()));
      simple.mock(db.watchList, "lastChanged").callFn(displayId =>
        Promise.resolve(lastChangedMap[displayId]));

      simple.mock(db.fileMetadata, "hasMetadata").resolveWith(true);
      simple.mock(displayConnections, "hasSparkFor").returnWith(true);
    });

    afterEach(() => lastChangedMap = {});

    it("updates db on DELETE", () => {
      const delPodMsg = Object.assign({}, testIncomingADDMessage, {type: "DELETE"});

      return fileUpdateHandler.doOnIncomingPod(delPodMsg)
      .then(()=>{
        assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
        assert.equal(displayConnections.sendMessage.callCount, watchers.length);

        displayConnections.sendMessage.calls.forEach(call => {
          const displayId = call.args[0];
          const message = call.args[1];

          assert.equal(message.topic, "MSFILEUPDATE");
          assert.equal(message.filePath, "my-bucket/my-file");
          assert.equal(message.version, "12345");
          assert.equal(message.type, "DELETE");
          assert(!message.token);
          assert.equal(message.watchlistLastChanged, lastChangedMap[displayId]);
        });

        assert.equal(db.fileMetadata.setFileVersion.callCount, 1);
        assert.equal(db.watchList.updateVersion.callCount, 1);
      });
    });

    it("updates db on UPDATE", () => {
      const updMsg = Object.assign({}, testIncomingADDMessage, {type: "UPDATE"});

      return fileUpdateHandler.doOnIncomingPod(updMsg)
      .then(()=>{
        assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
        assert.equal(db.fileMetadata.setFileVersion.callCount, 1);
        assert.equal(db.watchList.updateVersion.callCount, 1);
        assert.equal(displayConnections.sendMessage.callCount, watchers.length);

        displayConnections.sendMessage.calls.forEach(call => {
          const displayId = call.args[0];
          const message = call.args[1];

          assert.equal(message.topic, "MSFILEUPDATE");
          assert.equal(message.filePath, "my-bucket/my-file");
          assert.equal(message.version, "12345");
          assert.equal(message.type, "UPDATE");
          assert(message.token);
          assert.equal(message.watchlistLastChanged, lastChangedMap[displayId]);
        });

        assert.equal(db.fileMetadata.deleteMetadata.callCount, 0);
      });
    });

    it("updates db on ADD", () => {
      simple.mock(db.folders, "addFileToFolder").callFn(input=>input);

      return fileUpdateHandler.doOnIncomingPod(testIncomingADDMessage)
      .then(()=>{
        assert.equal(db.fileMetadata.getWatchersFor.callCount, 1);
        assert.equal(db.fileMetadata.setFileVersion.callCount, 1);
        assert.equal(db.watchList.updateVersion.callCount, 1);
        assert.equal(displayConnections.sendMessage.callCount, watchers.length);

        displayConnections.sendMessage.calls.forEach(call => {
          const displayId = call.args[0];
          const message = call.args[1];

          assert.equal(message.topic, "MSFILEUPDATE");
          assert.equal(message.filePath, "my-bucket/my-file");
          assert.equal(message.version, "12345");
          assert.equal(message.type, "ADD");
          assert(message.token);
          assert.equal(message.watchlistLastChanged, lastChangedMap[displayId]);
        });

        assert.equal(db.fileMetadata.deleteMetadata.callCount, 0);
      });
    });
  });

});
