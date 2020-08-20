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
    const expectedStatus = "connected"
    const testId = "test-id";

    googlePubSub.publishConnection(testId);

    const publishedMessage = JSON.parse(publishStub.lastCall.args[0].toString());

    assert.deepEqual(publishedMessage.id, testId);
    assert.deepEqual(publishedMessage.status, expectedStatus);
  });

  it("publishes message on display disconnection", ()=>{
    const expectedStatus = "disconnected"
    const testId = "test-id";

    googlePubSub.publishDisconnection("test-id");

    const publishedMessage = JSON.parse(publishStub.lastCall.args[0].toString());

    assert.deepEqual(publishedMessage.id, testId);
    assert.deepEqual(publishedMessage.status, expectedStatus);
  });
});
