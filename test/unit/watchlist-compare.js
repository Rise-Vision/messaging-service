/* eslint-env mocha */

const assert = require("assert");
const simple = require("simple-mock");

const db = require("../../src/db/api");
const displayConnections = require("../../src/event-handlers/display-connections");
const handler = require("../../src/event-handlers/messages/watchlist-compare");

describe("watchlist-compare : Unit", ()=>{

  afterEach(() => simple.restore());

  describe("canHandle", () => {
    it("can use the handler if it's WATCHLIST-COMPARE with a lastChanged value", () => {
      const canHandle = handler.canHandle({
        topic: "WATCHLIST-COMPARE",
        lastChanged: "123456"
      });

      assert(canHandle);
    });

    it("can't use the handler if it has no lastChanged value", () => {
      const canHandle = handler.canHandle({
        topic: "WATCHLIST-COMPARE"
      });

      assert(!canHandle);
    });

    it("can't use the handler if the topic is not WATCHLIST-COMPARE", () => {
      const canHandle = handler.canHandle({
        topic: "WATCH"
      });

      assert(!canHandle);
    });
  });

  describe("doOnIncomingPod", () => {
    const mockWatchlist = {
      "bucket/file1": "1",
      "bucket/file2": "1",
      "bucket/file3": "1"
    };

    beforeEach(() => {
      simple.mock(db.watchList, "lastChanged").resolveWith("123456");
      simple.mock(db.watchList, "get").resolveWith(mockWatchlist);

      simple.mock(displayConnections, "sendMessage").returnWith();
    });

    it("sends back the full watchlist if the lastChanged timestamp does not match", () => {
      return handler.doOnIncomingPod({
        displayId: "ABC1234", lastChanged: "121212"
      })
      .then(() => {
        assert.equal(displayConnections.sendMessage.callCount, 1);
        assert.equal(displayConnections.sendMessage.lastCall.args[0], "ABC1234");
        assert.deepEqual(displayConnections.sendMessage.lastCall.args[1], {
          topic: "watchlist-result",
          watchlist: mockWatchlist,
          lastChanged: "123456"
        });
      });
    });
  });

});
