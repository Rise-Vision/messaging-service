/* eslint-env mocha */

const assert = require("assert");
const rp = require("request-promise-native");
const simple = require("simple-mock");
const watchRequest = require("../../src/event-handlers/messages/watch");
const folderWatchRequest = require("../../src/event-handlers/messages/folder-watch");
const unwatchRequest = require("../../src/event-handlers/messages/unwatch");
const watchlistCompareRequest = require("../../src/event-handlers/messages/watchlist-compare");

const testPort = 9228;
const BAD_REQUEST = 400;

describe("Direct HTTP request", ()=>{

  it("expects topic parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?displayId=xxx`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Topic"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects displayId parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=xxx`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("displayId"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("responds ok and calls event handler for watch", ()=>{
    simple.mock(watchRequest, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&displayId=ABCDE&filePath=xxx.yyy`,
      json: true
    })
    .then(()=>{
      assert(watchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for unwatch", ()=>{
    simple.mock(unwatchRequest, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=unwatch&displayId=ABCDE&filePaths=xxx.yyy`,
      json: true
    })
    .then(()=>{
      assert(unwatchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for folder-watch", ()=>{
    simple.mock(folderWatchRequest, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&displayId=ABCDE&filePaths=xxx.yyy/`,
      json: true
    })
    .then(()=>{
      assert(folderWatchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for watchlist-compare", ()=>{
      simple.mock(watchlistCompareRequest, "doOnIncomingPod").returnWith();
      return rp({
        method: "GET",
        uri: `http://localhost:${testPort}/messaging/direct?topic=watchlist-compare&displayId=ABCDE&lastChanged=xxx`,
        json: true
      })
      .then(()=>{
        assert(watchlistCompareRequest.doOnIncomingPod.called)
      });
    });
});
