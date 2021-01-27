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

  afterEach(()=>simple.restore());

  // A connections:id:[id] key is used to keep track of connected displays.
  // If a display disconnects cleanly, the key is deleted,
  // and google pubsub is notified via display-connections.js. No keyevent is sent.
  // If a display does not cleanly disconnect, the heartbeat will be missed,
  // and the key will expire. In this case, a keyevent is sent, and a
  // disconnect message should be sent to the google pubsub topic
  describe("Display heartbeat is missed (expired key)", ()=>{
    const fakeSpark = {id: "fake-spark-id", query: {displayId: "fake-display-id"}};

    it("Publishes disconnection if pod has spark for the display", ()=>{
      simple.mock(displayConnections, "hasSparkFor").returnWith(true);
      simple.mock(db.connections, "sparkMatchesOrMissing").returnWith(Promise.resolve(true));

      return new Promise(res=>{
        simple.mock(googlePubSub, "publishDisconnection").callFn(res);
        simple.mock(googlePubSub, "publishConnection").returnWith(Promise.resolve());
        db.setHeartbeatExpirySeconds(1);

        displayConnections.put(fakeSpark);
      });
    });
    it("Does not publish to google pubsub if pod does not have spark", ()=>{
      return new Promise(res=>{
        simple.mock(displayConnections, "hasSparkFor").callFn(()=>{
          res();
          return false;
        });

        db.setHeartbeatExpirySeconds(1);

        db.connections.setConnected("fake-id");
      });
    });
  })
});
