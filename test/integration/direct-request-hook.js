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
const FORBIDDEN = 403;

describe("Direct HTTP request", ()=>{

  it("expects topic parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?endpointId=xxx&scheduleId=yyy`,
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

  it("expects endpointId parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&filePath=xxx.yyy&scheduleId=zzz`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("endpointId"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects scheduleId parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&endpointId=ABCDE&filePath=xxx.yyy`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("scheduleId"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("does not expect displayId parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&endpointId=ABCDE&filePath=xxx.yyy&scheduleId=zzz&displayId=yyy`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Displays are not allowed"));
      assert(err.statusCode === FORBIDDEN);
    });
  });

  it("does not allow reboot", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=reboot&endpointId=ABCDE`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Topic is not valid"));
      assert(err.statusCode === FORBIDDEN);
    });
  });

  it("does not allow restart", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=restart&endpointId=ABCDE`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Topic is not valid"));
      assert(err.statusCode === FORBIDDEN);
    });
  });

  it("does not allow screenshot", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=screenshot&endpointId=ABCDE`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Topic is not valid"));
      assert(err.statusCode === FORBIDDEN);
    });
  });

  it("responds ok and calls event handler for watch", ()=>{
    simple.mock(watchRequest, "doOnIncomingPod").callFn((query, resp)=>{
      resp.send();
    });
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&endpointId=ABCDE&filePath=xxx.yyy&scheduleId=zzz`,
      json: true
    })
    .then(()=>{
      assert(watchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for unwatch", ()=>{
    simple.mock(unwatchRequest, "doOnIncomingPod").callFn((query, resp)=>{
      resp.send();
    });
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=unwatch&endpointId=ABCDE&filePaths=xxx.yyy&scheduleId=zzz`,
      json: true
    })
    .then(()=>{
      assert(unwatchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for folder-watch", ()=>{
    simple.mock(folderWatchRequest, "doOnIncomingPod").callFn((query, resp)=>{
      resp.send();
    });
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/direct?topic=watch&endpointId=ABCDE&filePath=xxx.yyy/&scheduleId=zzz`,
      json: true
    })
    .then(()=>{
      assert(folderWatchRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for watchlist-compare", ()=>{
      simple.mock(watchlistCompareRequest, "doOnIncomingPod").callFn((query, resp)=>{
        resp.send();
      });
      return rp({
        method: "GET",
        uri: `http://localhost:${testPort}/messaging/direct?topic=watchlist-compare&endpointId=ABCDE&lastChanged=xxx&scheduleId=zzz`,
        json: true
      })
      .then(()=>{
        assert(watchlistCompareRequest.doOnIncomingPod.called)
      });
    });
});
