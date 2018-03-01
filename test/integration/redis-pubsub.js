/* eslint-env mocha */
const assert = require("assert");
const rp = require("request-promise-native");
const gcs = require("../../src/version-compare/gcs");
const simple = require("simple-mock");
const podname = "test-pod";
const testPort = 9228;
const reasonableResponseTime = 1000;
const redis = require("redis");
const redisHost = "127.0.0.1";
const channel = "pubsub-update";
const displayConnections = require("../../src/messages/display-connections");
const fileUpdateHandler = require("../../src/pubsub-connector/file-update-handler");
const restartReboot = require("../../src/messages/restart-reboot");
const redisPubsub = require("../../src/redis-pubsub");

describe("Pubsub : Integration", ()=>{
  let msServer = null;

  before(()=>{
    simple.mock(gcs, "init").returnWith();

    process.env.MS_PORT = testPort;
    process.env.podname = podname;
    process.env.NODE_ENV = "test";

    redisPubsub.init([restartReboot, fileUpdateHandler]);
  });

  after(()=>{
    simple.restore();
    msServer.kill();
  });

  describe("With a local running redis server", ()=>{
    describe("and the messaging service under test running, it...", ()=>{
      before(()=>{
        msServer = require("../../index.js");
        msServer.dropSocketsAfterTimeMS(reasonableResponseTime);
      });

      it("receives POST update from pubsub connector, processes update, and shares to other pods", ()=>{
        simple.mock(fileUpdateHandler, "processUpdate");

        const updateFromPubsubConnector = {
          filePath: "test-file-path/test-object",
          version: "0",
          type: "add"
        };

        const otherPodSubscriber = redis.createClient({host: redisHost});
        otherPodSubscriber.subscribe(channel);

        const otherPodSubscriberPromise = new Promise(res=>{
          otherPodSubscriber.on("message", (ch, msg)=>{
            assert.equal(ch, channel);
            assert(msg.includes(podname));
            assert(msg.includes("test-file-path"));
            res();
          });
        });

        return rp({
          method: "POST",
          uri: `http://localhost:${testPort}/messaging/pubsub`,
          body: updateFromPubsubConnector,
          json: true
        })
        .then((responseToPubsubConnector)=>{
          const expectedResponse = Object.assign(updateFromPubsubConnector, {podname});

          assert.deepEqual(responseToPubsubConnector, expectedResponse);
          assert.equal(fileUpdateHandler.processUpdate.callCount, 1)
          simple.restore(fileUpdateHandler, "processUpdate");
          return otherPodSubscriberPromise.then(otherPodSubscriber.quit());
        });
      });

      it("receives PUBSUB update through REDIS from another MS pod and processes the update", ()=>{
        const testMessage = JSON.stringify({filePath: "test"});

        const mainSubscriberPodPromise = new Promise(res=>{
          simple.mock(fileUpdateHandler, "processUpdate").callFn(res);
        });

        const otherPodPublisher = redis.createClient({host: redisHost});
        otherPodPublisher.publish(channel, testMessage);

        return mainSubscriberPodPromise.then(()=>{
          assert.equal(fileUpdateHandler.processUpdate.callCount, 1);
          assert.deepEqual(fileUpdateHandler.processUpdate.lastCall.arg, {filePath: "test"});
          simple.restore(fileUpdateHandler, "processUpdate");
        });
      });

      it("receives PUBSUB update through REDIS for restart-request", ()=>{
        const testMessage =
          JSON.stringify({displayId: 'ABCDEF', msg: "restart-request"});

        const mainSubscriberPodPromise = new Promise(res=>{
          simple.mock(displayConnections, "sendMessage").callFn(res);
        });

        const otherPodPublisher = redis.createClient({host: redisHost});
        otherPodPublisher.publish(channel, testMessage);

        return mainSubscriberPodPromise.then(()=>{
          assert.equal(displayConnections.sendMessage.callCount, 1);
          assert.equal(displayConnections.sendMessage.lastCall.args[0], 'ABCDEF');
          assert.deepEqual(displayConnections.sendMessage.lastCall.args[1], {
            displayId: 'ABCDEF', msg: "restart-request"
          });
          simple.restore(displayConnections, "sendMessage");
        });
      });

      it("receives PUBSUB update through REDIS for reboot-request", ()=>{
        const testMessage =
          JSON.stringify({displayId: 'ABCDEF', msg: "reboot-request"});

        const mainSubscriberPodPromise = new Promise(res=>{
          simple.mock(displayConnections, "sendMessage").callFn(res);
        });

        const otherPodPublisher = redis.createClient({host: redisHost});
        otherPodPublisher.publish(channel, testMessage);

        return mainSubscriberPodPromise.then(()=>{
          assert.equal(displayConnections.sendMessage.callCount, 1);
          assert.equal(displayConnections.sendMessage.lastCall.args[0], 'ABCDEF');
          assert.deepEqual(displayConnections.sendMessage.lastCall.args[1], {
            displayId: 'ABCDEF', msg: "reboot-request"
          });
          simple.restore(displayConnections, "sendMessage");
        });
      });

      it("forwards reboot messages", () => {
        simple.mock(displayConnections, "sendMessage").returnWith();
        simple.mock(redisPubsub, "publishToPods").returnWith();

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

        simple.restore(displayConnections, "sendMessage");
        simple.restore(redisPubsub, "publishToPods");
      });

      it("forwards restart messages", () => {
        simple.mock(displayConnections, "sendMessage").returnWith();
        simple.mock(redisPubsub, "publishToPods").returnWith();

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

        simple.restore(displayConnections, "sendMessage");
        simple.restore(redisPubsub, "publishToPods");
      });

    });
  });

});