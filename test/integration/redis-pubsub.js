/* eslint-env mocha */
const assert = require("assert");
const rp = require("request-promise-native");
const gcs = require("../../src/gcs");
const simple = require("simple-mock");
const podname = "test-pod";
const testPort = 9228;
const redis = require("redis");
const redisHost = "127.0.0.1";
const channel = "inter-pod-publish";
const fileUpdateHandler = require("../../src/event-handlers/messages/gcs-file-update");
const db = require("../../src/db/api");

describe("Pubsub : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();

    process.env.MS_PORT = testPort;
    process.env.podname = podname;
    process.env.NODE_ENV = "test";
  });

  after(()=>{
    simple.restore();
  });

  describe("With a local running redis and MS servers", ()=>{

    it("receives POST update from pubsub connector and quits when no entry exists", ()=>{
      simple.mock(fileUpdateHandler, "doOnIncomingPod");
      simple.mock(db.fileMetadata, "hasMetadata");

      const updateFromPubsubConnector = {
        filePath: "test-file-path/test-object",
        version: "0",
        type: "ADD"
      };

      return rp({
        method: "POST",
        uri: `http://localhost:${testPort}/messaging/pubsub`,
        body: updateFromPubsubConnector,
        json: true
      })
      .then(()=>{
        assert.equal(fileUpdateHandler.doOnIncomingPod.callCount, 1)
        assert.equal(db.fileMetadata.hasMetadata.callCount, 1)
        simple.restore(fileUpdateHandler, "doOnIncomingPod");
      });
    });

    it("receives POST update from pubsub connector, processes update, and shares to other pods", ()=>{
      simple.mock(fileUpdateHandler, "doOnIncomingPod");
      simple.mock(db.fileMetadata, "hasMetadata").resolveWith(1);
      simple.mock(db.fileMetadata, "getWatchersFor").resolveWith(["ABCD"]);

      const updateFromPubsubConnector = {
        filePath: "test-file-path/test-object",
        version: "0",
        type: "ADD"
      };

      const otherPodSubscriber = redis.createClient({host: redisHost});
      const otherPodSubscriberPromise = new Promise(res=>{
        otherPodSubscriber.subscribe(channel);
        otherPodSubscriber.on("message", (ch, msg)=>{
          console.log("Received message into other pod");
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
      .then(()=>{
        assert.equal(fileUpdateHandler.doOnIncomingPod.callCount, 1)
        simple.restore(fileUpdateHandler, "doOnIncomingPod");
        simple.restore(db.fileMetadata, "hasMetadata");
        simple.restore(db.fileMetadata, "getWatchersFor");
        console.log("Waiting for other pod subscription");
        return otherPodSubscriberPromise.then(()=>otherPodSubscriber.quit());
      });
    });

    it("receives PUBSUB update through REDIS from another MS pod and processes the update", ()=>{
      const testMessage = JSON.stringify({filePath: "test", type: "ADD"});

      const mainSubscriberPodPromise = new Promise(res=>{
        simple.mock(fileUpdateHandler, "doOnAllPods").callFn(res);
      });

      const otherPodPublisher = redis.createClient({host: redisHost});
      otherPodPublisher.publish(channel, testMessage);

      return mainSubscriberPodPromise.then(()=>{
        assert.equal(fileUpdateHandler.doOnAllPods.callCount, 1);
        assert.deepEqual(fileUpdateHandler.doOnAllPods.lastCall.arg, JSON.parse(testMessage));
        simple.restore(fileUpdateHandler, "doOnAllPods");
      });
    });
  });
});
