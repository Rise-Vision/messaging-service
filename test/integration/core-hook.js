/* eslint-env mocha */
const assert = require("assert");
const rp = require("request-promise-native");
const testPort = 9228;
const simple = require("simple-mock");
const BAD_REQUEST = 400;
const NOT_AUTHORIZED = 403;
const screenshotHandler = require("../../src/event-handlers/messages/screenshot-request");
const debugDataRequest = require("../../src/event-handlers/messages/debug-data-request");
const clearLocalStorageRequest = require("../../src/event-handlers/messages/clear-local-storage-request");

describe("Webhooks : CORE : GET", ()=>{
  it("expects msg parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("msg"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects did parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=restart`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("did"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects server key", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=restart&did=ABCDE`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      console.log(err.message);
      assert(err.message.includes("sk"));
      assert(err.statusCode === NOT_AUTHORIZED);
    });
  });

  it("expects cid for screenshot requests", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=screenshot&did=ABCDE&sk=TEST`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      console.log(err.message);
      assert(err.message.includes("cid"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects url for screenshot requests", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=screenshot&did=ABCDE&sk=TEST&cid=12345`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      console.log(err.message);
      assert(err.message.includes("url"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects url for screenshot requests", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=screenshot&did=ABCDE&sk=TEST&cid=12345`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      console.log(err.message);
      assert(err.message.includes("url"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("responds ok and calls event handler", ()=>{
    simple.mock(screenshotHandler, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=screenshot&did=ABCDE&sk=TEST&cid=12345&url=http://test`,
      json: true
    })
    .then(()=>{
      assert(screenshotHandler.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for debug-data-request", ()=>{
    simple.mock(debugDataRequest, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=debug-data-request&did=ABCDE&sk=TEST`,
      json: true
    })
    .then(()=>{
      assert(debugDataRequest.doOnIncomingPod.called)
    });
  });

  it("responds ok and calls event handler for clear-local-storage-request", ()=>{
    simple.mock(clearLocalStorageRequest, "doOnIncomingPod").returnWith();
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core?msg=clear-local-storage-request&did=ABCDE&sk=TEST`,
      json: true
    })
    .then(()=>{
      assert(clearLocalStorageRequest.doOnIncomingPod.called)
    });
  });
});
