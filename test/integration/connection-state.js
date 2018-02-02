/* eslint-env mocha */
const assert = require("assert");
const gcs = require("../../src/version-compare/gcs.js");
const datastore = require("../../src/db/redis/datastore.js");
const simple = require("simple-mock");
const testPort = 9228;
const Primus = require("primus");
const msEndpoint = `http://localhost:${testPort}/messaging/`;

let testMSConnection = null;

describe("MS Connection State : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();
    return datastore.eraseEntireDb();
  });

  after(()=>{
    simple.restore();
  });

  describe("With the messaging server under test running it...", ()=>{
    it("saves connection state to redis on spark connection / disconnection", ()=>{
      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      return Promise.resolve()
      .then(confirmIdNotInDB(displayId))
      .then(connectToMS(msUrl))
      .then(waitRedisUpdate)
      .then(confirmIdInDB(displayId))
      .then(disconnectFromMS)
      .then(waitRedisUpdate)
      .then(confirmIdNotInDB(displayId));
    });
  });
});


function confirmIdNotInDB(displayId) {
  return function() {
    return datastore.getSet("connections:id")
    .then(ids=>assert(!ids.includes(displayId)));
  }
}

function connectToMS(msUrl) {
  return function() {
    testMSConnection = new (Primus.createSocket({
      transformer: "websockets",
      pathname: "messaging/primus/"
    }))(msUrl);
  }
}

function waitRedisUpdate() {
  const redisUpdateDelay = 200;
  return new Promise(res=>setTimeout(res, redisUpdateDelay));
}

function confirmIdInDB(displayId) {
  return function() {
    return datastore.getSet("connections:id")
    .then(ids=>assert(ids.includes(displayId)));
  }
}

function disconnectFromMS() {
  testMSConnection.end();
}
