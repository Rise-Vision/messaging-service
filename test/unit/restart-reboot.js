/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const displayConnections = require("../../src/messages/display-connections");
const restartReboot = require("../../src/messages/restart-reboot");
const redisPubsub = require("../../src/redis-pubsub");

describe("Restart / Reboot : Unit", ()=>{

  beforeEach(() => {
    simple.mock(displayConnections, "sendMessage").returnWith();
    simple.mock(redisPubsub, "publishToPods").returnWith();
  })

  afterEach(() => simple.restore());

  it("forwards reboot messages", () => {
    restartReboot.forwardRebootMessage('ABC124');

    assert(displayConnections.sendMessage.callCount, 1);
    assert.deepEqual(displayConnections.sendMessage.lastCall.args, [
      'ABC124', {
        msg: 'reboot-request', displayId: 'ABC124'
      }
    ]);

    assert(redisPubsub.publishToPods.callCount, 1);
    assert.deepEqual(redisPubsub.publishToPods.lastCall.args[0], {
        msg: 'reboot-request', displayId: 'ABC124'
    });
  });

  it("forwards restart messages", () => {
    restartReboot.forwardRestartMessage('ABC124');

    assert(displayConnections.sendMessage.callCount, 1);
    assert.deepEqual(displayConnections.sendMessage.lastCall.args, [
      'ABC124', {
        msg: 'restart-request', displayId: 'ABC124'
      }
    ]);

    assert(redisPubsub.publishToPods.callCount, 1);
    assert.deepEqual(redisPubsub.publishToPods.lastCall.args[0], {
        msg: 'restart-request', displayId: 'ABC124'
    });
  });

});
