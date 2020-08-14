/* eslint-env mocha */
const googlePubSub = require("../../src/google-pubsub");
const assert = require("assert");
const simple = require("simple-mock");

describe("Google PubSub", ()=>{
  const publishStub = simple.stub().returnWith(Promise.resolve("test-msg-id"));

  beforeEach(()=>{
    simple.mock(googlePubSub.getClient(), "topic").returnWith({
      publish: publishStub
    });
  });

  afterEach(()=>{
    simple.restore();
  });

  it("publishes message on display connection", ()=>{
    googlePubSub.publishConnection("test-id");

    assert(publishStub.called);

    const messageBuffer = publishStub.lastCall.args[0];
    assert.deepEqual(JSON.parse(messageBuffer.toString()).id, "test-id");
  });
});
