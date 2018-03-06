/* eslint-env mocha */
const assert = require("assert");
const rp = require("request-promise-native");
const testPort = 9228;
const simple = require("simple-mock");
const fileUpdateHandler = require("../../src/event-handlers/messages/gcs-file-update");

describe("Webhooks : PubSubConnector : POST", ()=>{
  beforeEach(()=>{
    simple.mock(fileUpdateHandler, "doOnIncomingPod").returnWith();
  });

  afterEach(()=>{
    simple.restore();
  });

  describe("when the type isn't valid it...", ()=>{
    it("responds to clear the message from Google pubsub but doesn't call the handler", ()=>{
      return rp({
        method: "POST",
        uri: `http://localhost:${testPort}/messaging/pubsub`,
        body: {type: "Invalid"},
        json: true
      })
      .then(()=>{
        assert.equal(fileUpdateHandler.doOnIncomingPod.callCount, 0);
      })
    });
  });
});
