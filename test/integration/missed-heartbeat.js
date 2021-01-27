/* eslint-env mocha */
const assert = require("assert");
const displayConnections = require("../../src/event-handlers/display-connections");
const googlePubSub = require("../../src/google-pubsub");
const redis = require("../../src/db/redis/datastore.js");
const db = require("../../src/db/api.js");
const simple = require("simple-mock");

describe("MISSED HEARTBEAT : Integration", ()=>{
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
    it("Publishes disconnection if pod has matching spark for the display", ()=>{
      simple.mock(displayConnections, "hasSparkFor").returnWith(true);
      simple.mock(db.connections, "sparkMatchesOrMissing").returnWith(Promise.resolve(true));

      return new Promise(res=>{
        simple.mock(googlePubSub, "publishDisconnection").callFn(res);
        simple.mock(googlePubSub, "publishConnection").returnWith(Promise.resolve());
        db.setHeartbeatExpirySeconds(1);

        const fakeSpark = {id: "fake-spark-id-1", query: {displayId: "fake-display-id-1"}};
        displayConnections.put(fakeSpark);
      });
    });

    it("Does not publish to google pubsub if pod does not have matching spark", ()=>{
      let notPublished = true;

      simple.mock(displayConnections, "hasSparkFor").returnWith(true);
      simple.mock(displayConnections, "remove").callFn(()=>notPublished = false);

      return new Promise(res=>{
        simple.mock(db.connections, "sparkMatchesOrMissing").callFn(()=>{res(); return Promise.resolve(false);});
        simple.mock(googlePubSub, "publishConnection").returnWith(Promise.resolve());
        db.setHeartbeatExpirySeconds(1);

        const fakeSpark = {id: "fake-spark-id-2", query: {displayId: "fake-display-id-2"}};
        displayConnections.put(fakeSpark);
      })
      .then(()=>new Promise(res=>setTimeout(res, 0)))
      .then(()=>assert(notPublished));
    });
  })
});
