/* eslint-env mocha */
// const assert = require("assert");
// const missedHeartbeat = require("../../src/event-handlers/messages/missed-heartbeat");
const displayConnections = require("../../src/event-handlers/display-connections");
const googlePubSub = require("../../src/google-pubsub");
const redis = require("../../src/db/redis/datastore.js");
const db = require("../../src/db/api.js");
const simple = require("simple-mock");

describe("MISSED HEARTBEAT : Integration", ()=>{
 //  const displayId = "fakeId";

  before(()=>{
    return redis.eraseEntireDb();
  });

  after(()=>{
    simple.restore();
  });

  // A connections:id:[id] key is used to keep track of connected displays.
  // If a display disconnects cleanly, the key is deleted,
  // and google pubsub is notified via display-connections.js. No keyevent is sent.
  // If a display does not cleanly disconnect, the heartbeat will be missed,
  // and the key will expire. In this case, a keyevent is sent, and a
  // disconnect message should be sent to the google pubsub topic
  describe("Display heartbeat is missed (expired key)", ()=>{
    it("Publishes disconnection and deletes key if pod has spark for the display", ()=>{
      simple.mock(displayConnections, "hasSparkFor").returnWith(true);

      db.setHeartbeatExpirySeconds(1);
      process.nextTick(()=>db.connections.setConnected("fake-id", "pod-a"));

      return Promise.all([
        new Promise(res=>{
          simple.mock(googlePubSub, "publishDisconnection").callFn(res);
        }),
        new Promise(res=>{
          simple.mock(db.connections, "setDisconnected").callFn(()=>{
            res();
            return Promise.resolve();
          });
        })
      ]);
    });

    it("Does not publish to google pubsub if pod does not have spark", ()=>{
      return new Promise(res=>{
        simple.mock(displayConnections, "hasSparkFor").callFn(()=>{
          res();
          return false;
        });

        db.setHeartbeatExpirySeconds(1);

        db.connections.setConnected("fake-id", "pod-a");
        simple.mock(googlePubSub, "publishDisconnection").callFn(()=>{throw Error("should-not-have-called")})
      });
    });
  })
});
