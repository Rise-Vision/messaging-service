/* eslint-env mocha */
const googlePubSub = require("../../src/google-pubsub");
const assert = require("assert");
const simple = require("simple-mock");

describe("Google PubSub", ()=>{
  let publishStub = null;

  beforeEach(()=>{
    publishStub = simple.mock(googlePubSub.getClient(), "publish").returnWith(Promise.resolve("test-msg-id"));
  });

  afterEach(()=>{
    simple.restore();
  });

  it("publishes message on display connection", ()=>{
    const expectedStatus = "connected"
    const testId = "test-id";

    googlePubSub.publishConnection(testId);

    const publishedMessage = JSON.parse(publishStub.lastCall.args[0].messages[0].data.toString());

    assert.deepEqual(publishedMessage.id, testId);
    assert.deepEqual(publishedMessage.status, expectedStatus);
  });

  it("publishes message on display disconnection", ()=>{
    const expectedStatus = "disconnected"
    const testId = "test-id";

    googlePubSub.publishDisconnection(testId);

    const publishedMessage = JSON.parse(publishStub.lastCall.args[0].messages[0].data.toString());

    assert.deepEqual(publishedMessage.id, testId);
    assert.deepEqual(publishedMessage.status, expectedStatus);
  });
});
