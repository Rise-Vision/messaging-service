/* eslint-env mocha */
/* eslint-disable function-paren-newline */

const assert = require("assert");
const simple = require("simple-mock");
const {dirname} = require("path");
const crypto = require("crypto");
const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore");

describe("DB API : Integration", ()=>{
  before(()=>{
    datastore.initdb();
  });

  beforeEach(()=>{
    return datastore.eraseEntireDb();
  });

  afterEach(() => simple.restore());

  describe("watchList", () => {
    const fakeTimestamp = 12345;

    beforeEach(() => {
      simple.mock(Date, "now").returnWith(fakeTimestamp);
    })

    it("updates and retrieves last changed value", () => {
      return dbApi.watchList.updateLastChanged("ABC124")
      .then(() => dbApi.watchList.lastChanged("ABC124"))
      .then(lastChanged => assert.equal(lastChanged, fakeTimestamp));
    });

    it("retrieves last changed value even if it was not set before", () => {
      return dbApi.watchList.lastChanged("ABC124")
      .then(lastChanged => assert.equal(lastChanged, '0'));
    });

    it("gets the full watchlist for a display", () => {
      const filePaths = ["bucket/file1", "bucket/file2", "bucket/file3"];

      return Promise.all(
        filePaths.map(filePath => ({
          filePath, version: "1", displayId: "ABC124"
        }))
        .map(dbApi.watchList.put)
      )
      .then(() => dbApi.watchList.get("ABC124"))
      .then(watchlist => {
        assert.deepEqual(watchlist, {
          "bucket/file1": "1",
          "bucket/file2": "1",
          "bucket/file3": "1"
        });
      })
      .then(() => dbApi.watchList.lastChanged("ABC124"))
      .then(lastChanged => assert.equal(lastChanged, fakeTimestamp));
    });

    it("should unwatch entries", () => {
      const entries = [
        {filePath: "bucket/file1", version: "1", displayId: "ABC124"},
        {filePath: "bucket/file1", version: "1", displayId: "ABC123"},
        {filePath: "bucket/file2", version: "0", displayId: "ABC124"},
        {filePath: "bucket/file3", version: "0", displayId: "ABC124"},
        {filePath: "bucket/file3", version: "0", displayId: "ABC123"}
      ];

      const displayId = "ABC124";

      const addEntry = entry => Promise.all([
        dbApi.watchList.put(entry),
        dbApi.fileMetadata.addDisplayTo(entry.filePath, entry.displayId),
        dbApi.fileMetadata.setFileVersion(entry.filePath, entry.version)
      ]);

      return Promise.all(entries.map(addEntry))
      .then(() => dbApi.watchList.unwatch(displayId, ["bucket/file2", "bucket/file3"]))
      .then(() => dbApi.watchList.get(displayId))
      .then(watchlist => {
        assert.deepEqual(watchlist, {
          "bucket/file1": "1"
        });
      });
    });

    it("should delete file metadata entries on unwatch when there is no other watcher", () => {
      const entries = [
        {filePath: "bucket/file1", version: "1", displayId: "ABC124"},
        {filePath: "bucket/file1", version: "1", displayId: "ABC123"},
        {filePath: "bucket/file2", version: "0", displayId: "ABC124"},
        {filePath: "bucket/file3", version: "0", displayId: "ABC124"},
        {filePath: "bucket/file3", version: "0", displayId: "ABC123"}
      ];

      const displayId = "ABC124";

      const addEntry = entry => Promise.all([
        dbApi.watchList.put(entry),
        dbApi.fileMetadata.addDisplayTo(entry.filePath, entry.displayId),
        dbApi.fileMetadata.setFileVersion(entry.filePath, entry.version)
      ]);

      return Promise.all(entries.map(addEntry))
      .then(() => dbApi.watchList.unwatch(displayId, ["bucket/file2", "bucket/file3"]))
      .then(() => {
        return dbApi.fileMetadata.hasMetadata("bucket/file2").then(hasMetadata => assert.equal(hasMetadata, 0));
      })
      .then(() => {
        return dbApi.fileMetadata.hasMetadata("bucket/file3").then(hasMetadata => assert.equal(hasMetadata, 1));
      })
      .then(() => {
        return dbApi.fileMetadata.hasMetadata("bucket/file1").then(hasMetadata => assert.equal(hasMetadata, 1));
      })
      .then(() => {
        return dbApi.fileMetadata.getWatchersFor("bucket/file2").then(watchers => assert.equal(watchers.length, 0));
      })
      .then(() => {
        return dbApi.fileMetadata.getWatchersFor("bucket/file3").then(watchers => assert.deepEqual(watchers, ["ABC123"]));
      });
    });
  });

  describe("getWatchersFor", ()=>{
    it("gets watchers as a combination of folder watchers and file watchers", ()=>{
      const filePath = "bucket/folder/file";
      const testDisplayIds = ["ABCD", "EFGH", "IJKL"];

      return setUpDBWithWatchEntries()
      .then(()=>{
        return dbApi.fileMetadata.getWatchersFor(filePath)
        .then(watchers=>assert.deepEqual(watchers.sort, testDisplayIds.sort));
      });

      function setUpDBWithWatchEntries() {
        const keyForFileWatchers = `meta:${filePath}:displays`;
        const keyForFolderWatchers = `meta:${dirname(filePath)}/:displays`;

        return datastore.setAdd(keyForFileWatchers, testDisplayIds)
        .then(()=>datastore.setAdd(keyForFolderWatchers, testDisplayIds));
      }
    });
  });

  describe("recordHeartbeat", ()=>{
    it("should call update function and set new key", ()=>{
      return Promise.all([
        new Promise(res=>simple.mock(datastore, "setString").callFn(res)),
        new Promise(updateFn=>dbApi.connections.recordHeartbeat(randomHexString(), updateFn))
      ]);
    });

    it("should not call update function when setting existing key", ()=>{
      const testId = randomHexString();

      return dbApi.connections.setConnected(testId)
      .then(()=>dbApi.connections.recordHeartbeat(testId, ()=>{throw Error("should not call")}));
    });

    function randomHexString() {
      const sufficientTestRandomBytes = 4;
      return crypto.randomBytes(sufficientTestRandomBytes).toString("hex");
    }
  });
});
