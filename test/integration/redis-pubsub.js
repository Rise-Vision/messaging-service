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
const pubsubUpdate = require("../../src/redis-pubsub/pubsub-update");

describe("Pubsub : Integration", ()=>{
  let msServer = null;

  before(()=>{
    simple.mock(gcs, "init").returnWith();

    process.env.MS_PORT = testPort;
    process.env.podname = podname;
    process.env.NODE_ENV = "test";
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
        simple.mock(pubsubUpdate, "processUpdate");

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
          assert.equal(pubsubUpdate.processUpdate.callCount, 1)
          simple.restore(pubsubUpdate, "processUpdate");
          return otherPodSubscriberPromise.then(otherPodSubscriber.quit());
        });
      });

      it("receives PUBSUB update through REDIS from another MS pod and processes the update", ()=>{
        const testMessage = JSON.stringify({test: "test"});

        const mainSubscriberPodPromise = new Promise(res=>{
          simple.mock(pubsubUpdate, "processUpdate").callFn(res);
        });

        const otherPodPublisher = redis.createClient({host: redisHost});
        otherPodPublisher.publish(channel, testMessage);

        return mainSubscriberPodPromise.then(()=>{
          assert.equal(pubsubUpdate.processUpdate.callCount, 1);
          assert.deepEqual(pubsubUpdate.processUpdate.lastCall.arg, testMessage);
          simple.restore(pubsubUpdate, "processUpdate");
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
    });
  });

});
