/* eslint-env mocha */
/* eslint-disable function-paren-newline */

const assert = require("assert");
const simple = require("simple-mock");

const datastore = require("../../src/db/redis/datastore");
const db = require("../../src/db/api");
const displayConnections = require("../../src/event-handlers/display-connections");
const handler = require("../../src/event-handlers/messages/watchlist-compare");

describe("watchlist-compare : Integration", () => {
  const fakeTimestamp = 123456;

  before(() => datastore.initdb());

  beforeEach(() => {
    simple.mock(Date, "now").returnWith(fakeTimestamp);
    simple.mock(displayConnections, "sendMessage").returnWith();

    return datastore.eraseEntireDb()
    .then(() => {
      const filePaths = ["bucket/file1", "bucket/file2", "bucket/file3"];

      return Promise.all(
        filePaths.map(filePath => ({
          filePath, version: "1", displayId: "ABC1234"
        }))
        .map(db.watchList.put)
      );
    });
  });

  afterEach(() => simple.restore());

  it("sends back the full watchlist if the lastChanged timestamp does not match", () => {
    return handler.doOnIncomingPod({
      displayId: "ABC1234", lastChanged: "121212"
    })
    .then(() => {
      assert.equal(displayConnections.sendMessage.callCount, 1);
      assert.equal(displayConnections.sendMessage.lastCall.args[0], "ABC1234");
      assert.deepEqual(displayConnections.sendMessage.lastCall.args[1], {
        topic: "watchlist-result",
        watchlist: {
          "bucket/file1": "1",
          "bucket/file2": "1",
          "bucket/file3": "1"
        },
        lastChanged: "123456"
      });
    });
  });

});
