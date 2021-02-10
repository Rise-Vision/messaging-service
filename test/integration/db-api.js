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
    it("should call update function if spark is different and set new key", ()=>{
      const displayId = randomHexString();
      const sparkId = randomHexString();

      return Promise.all([
        new Promise(res=>simple.mock(datastore, "setString").callFn(res)),
        new Promise(updateFn=>dbApi.connections.recordHeartbeat(displayId, sparkId, updateFn))
      ]);
    });

    it("should not call update function when spark matches", ()=>{
      const displayId = randomHexString();
      const sparkId = randomHexString();

      return dbApi.connections.setConnected(displayId, sparkId)
      .then(()=>dbApi.connections.recordHeartbeat(displayId, sparkId, ()=>{throw Error("should not call")}));
    });

    function randomHexString() {
      const sufficientTestRandomBytes = 4;
      return crypto.randomBytes(sufficientTestRandomBytes).toString("hex");
    }
  });

  describe("validation", () => {
    it("should add displayId", ()=>{
      return dbApi.validation.addDisplayId('DISPLAY_ID')
      .then(() => datastore.setHas('valid-displays', 'DISPLAY_ID'))
      .then(exists => assert(exists));
    });

    it("should remove displayId", ()=>{
      return dbApi.validation.addDisplayId('DISPLAY_ID')
      .then(() => dbApi.validation.removeDisplayId('DISPLAY_ID'))
      .then(() => datastore.setHas('valid-displays', 'DISPLAY_ID'))
      .then(exists => assert(!exists));
    });

    it("should add scheduleId", ()=>{
      return dbApi.validation.addScheduleId('SCHEDULE_ID')
      .then(() => datastore.setHas('valid-schedules', 'SCHEDULE_ID'))
      .then(exists => assert(exists));
    });

    it("should remove scheduleId", ()=>{
      return dbApi.validation.addScheduleId('DISPLAY_ID')
      .then(() => dbApi.validation.removeScheduleId('SCHEDULE_ID'))
      .then(() => datastore.setHas('valid-schedules', 'SCHEDULE_ID'))
      .then(exists => assert(!exists));
    });

    it("should ban an endpointId", ()=>{
      return dbApi.validation.banEndpointId('ENDPOINT_ID', 'REASON')
      .then(() => datastore.hashFieldExists('banned-endpoints', 'ENDPOINT_ID'))
      .then(exists => assert(exists));
    });

    it("should unban an endpointId", ()=>{
      return dbApi.validation.banEndpointId('ENDPOINT_ID', 'REASON')
      .then(() => dbApi.validation.unbanEndpointId('ENDPOINT_ID'))
      .then(() => datastore.hashFieldExists('banned-endpoints', 'ENDPOINT_ID'))
      .then(exists => assert(!exists));
    });

    describe("isValidDisplayId", ()=>{
      it("identifies a valid display id", ()=>{
        return datastore.setAdd('valid-displays', ['ABCD'])
        .then(()=>
          dbApi.validation.isValidDisplayId('ABCD')
          .then(isValid=>{
            assert(isValid);
          })
        );
      });

      it("identifies an invalid display id", ()=>{
        return dbApi.validation.isValidDisplayId('XHYZ')
        .then(isValid=>{
          assert(!isValid);
        })
      });
    });

    describe("isValidScheduleId", ()=>{
      it("identifies a valid schedule id", ()=>{
        return datastore.setAdd('valid-schedules', ['ABCD'])
        .then(()=>
          dbApi.validation.isValidScheduleId('ABCD')
          .then(isValid=>{
            assert(isValid);
          })
        );
      });

      it("identifies an invalid schedule id", ()=>{
        return dbApi.validation.isValidScheduleId('XHYZ')
        .then(isValid=>{
          assert(!isValid);
        })
      });
    });

    describe("isBannedEndpointId", ()=>{
      it("identifies a banned endpoint id", ()=>{
        return dbApi.validation.banEndpointId('ABCD')
        .then(()=>
          dbApi.validation.isBannedEndpointId('ABCD')
          .then(isBanned=>{
            assert(isBanned);
          })
        );
      });

      it("identifies a not banned endpoint id", ()=>{
        return dbApi.validation.isBannedEndpointId('XHYZ')
        .then(isBanned=>{
          assert(!isBanned);
        })
      });
    });
  });
});
