/* eslint-env mocha */
const assert = require("assert");
const gcs = require("../../src/gcs.js");
const googlePubSub = require("../../src/google-pubsub");
const request = require("request-promise-native");
const datastore = require("../../src/db/redis/datastore.js");
const dbApi = require("../../src/db/api.js");
const simple = require("simple-mock");
const testPort = 9228;
const Primus = require("primus");
const Socket = Primus.createSocket({
  transformer: "websockets",
  pathname: "messaging/primus/"
});
const msEndpoint = `http://localhost:${testPort}/messaging/`;

let testMSConnections = null;

describe("MS Connection State : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();
    simple.mock(googlePubSub, "publish").returnWith();
    dbApi.setHeartbeatExpirySeconds(5); // eslint-disable-line no-magic-numbers
    return datastore.eraseEntireDb();
  });

  after(()=>{
    simple.restore();
  });

  describe("With the messaging server under test running it...", ()=>{
    it("saves connection state to redis on spark connection / disconnection", ()=>{
      const displayId = "testId";

      return Promise.resolve()
      .then(confirmIdNotInDB(displayId))
      .then(()=>connectToMS([displayId]))
      .then(waitRedisUpdate.bind(null, 300)) // eslint-disable-line no-magic-numbers
      .then(confirmIdInDB(displayId))
      .then(disconnectFromMS)
      .then(waitRedisUpdate.bind(null, 1000)) // eslint-disable-line no-magic-numbers
      .then(confirmIdNotInDB(displayId));
    });

    it("accepts https requests for presence", ()=>{
      const testIds = ["ABCD", "EFGH"];

      const presenceCheck = {
        method: "POST",
        uri: `${msEndpoint}presence`,
        body: testIds,
        json: true
      };
      console.log(`Connecting to http with ${JSON.stringify(presenceCheck, null, 2)}`); // eslint-disable-line

      return connectToMS(testIds)
      .then(waitRedisUpdate.bind(null, 300)) // eslint-disable-line no-magic-numbers
      .then(()=>request(presenceCheck))
      .then(resp=>{
        console.log("presence response:");
        console.dir(resp);
        assert(testIds.every(id=>resp[id].connected));
      })
      .then(()=>disconnectFromMS())
      .then(waitRedisUpdate.bind(null, 500)) // eslint-disable-line no-magic-numbers
      .then(()=>connectToMS([testIds[0]]))
      .then(waitRedisUpdate.bind(null, 900)) // eslint-disable-line no-magic-numbers
      .then(()=>request(presenceCheck))
      .then(resp=>{
        console.log("presence response:");
        console.dir(resp);
        assert(resp[testIds[0]].connected);
        assert(!resp[testIds[0]].lastConnection);
        assert(!resp[testIds[1]].connected);
        assert(resp[testIds[1]].lastConnection);
      })
      .then(disconnectFromMS)
      .then(waitRedisUpdate.bind(null, 200)) // eslint-disable-line no-magic-numbers
    });
  });
});


function confirmIdNotInDB(displayId) {
  return function() {
    console.log(`checking db for absence of ${displayId}`);

    return datastore.getString(`connections:id:${displayId}`)
    .then(val=>{console.log(val); assert(!val)});
  }
}

function connectToMS(ids) {
  console.log(`Connecting to websocket for ${ids}`);

  testMSConnections = ids.map(id=>{
    const uri = `${msEndpoint}?displayId=${id}&machineId=${Math.random()}`;
    return new Socket(uri);
  });

  return Promise.resolve();
}

function waitRedisUpdate(delay) {
  const redisUpdateDelay = delay || 1200; // eslint-disable-line no-magic-numbers
  return new Promise(res=>setTimeout(res, redisUpdateDelay));
}

function confirmIdInDB(displayId) {
  return function() {
    console.log(`checking db for existence of ${displayId}`);
    return datastore.getString(`connections:id:${displayId}`)
    .then(val=>{console.log(val); assert(val);});
  }
}

function disconnectFromMS(connection) {
  if (connection) {return testMSConnections[connection].end();}
  testMSConnections.forEach(cnxn=>cnxn.end());
}
