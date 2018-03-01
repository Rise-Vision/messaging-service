/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const displayConnections = require("../../src/event-handlers/display-connections");
const restart = require("../../src/event-handlers/messages/restart");
const reboot = require("../../src/event-handlers/messages/reboot");
const redisPubsub = require("../../src/redis-pubsub");

describe("Restart : Unit", ()=>{

  beforeEach(() => {
    simple.mock(displayConnections, "sendMessage").returnWith();
    simple.mock(redisPubsub, "publishToPods").returnWith();
  })

  afterEach(() => simple.restore());

  it("sends message to display and distributes to other pods ", () => {
    restart.doOnIncomingPod({displayId: "ABCD"});

    assert(displayConnections.sendMessage.callCount, 1);
    assert.deepEqual(displayConnections.sendMessage.lastCall.args, [
      "ABCD",
      {msg: "restart-request"}
    ]);

    assert(redisPubsub.publishToPods.callCount, 1);
    assert.deepEqual(redisPubsub.publishToPods.lastCall.args[0], {
      displayId: "ABCD"
    });
  });
});

describe("Reboot : Unit", ()=>{

  beforeEach(() => {
    simple.mock(displayConnections, "sendMessage").returnWith();
    simple.mock(redisPubsub, "publishToPods").returnWith();
  })

  afterEach(() => simple.restore());

  it("sends message to display and distributes to other pods ", () => {
    reboot.doOnIncomingPod({displayId: "ABCD"});

    assert(displayConnections.sendMessage.callCount, 1);
    assert.deepEqual(displayConnections.sendMessage.lastCall.args, [
      "ABCD",
      {msg: "reboot-request"}
    ]);

    assert(redisPubsub.publishToPods.callCount, 1);
    assert.deepEqual(redisPubsub.publishToPods.lastCall.args[0], {
      displayId: "ABCD"
    });
  });
});
