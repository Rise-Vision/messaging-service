/* eslint-env mocha */
/* eslint-disable function-paren-newline */

const assert = require("assert");
const simple = require("simple-mock");

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
  });

});
