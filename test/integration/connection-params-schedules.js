/* eslint-env mocha */
const gcs = require("../../src/gcs.js");
const googlePubSub = require("../../src/google-pubsub");
const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore.js");
const simple = require("simple-mock");
const testPort = 9228;
const Primus = require("primus");
const msEndpoint = `http://localhost:${testPort}/messaging/`;

describe("MS Connection : Schedules : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();
    simple.mock(datastore, "initdb").returnWith();
    simple.mock(googlePubSub, "publish").returnWith(Promise.resolve());
  });

  after(()=>{
    simple.restore();
  });

  describe("With the messaging server under test running it...", ()=>{

    it("prevents connections with scheduleId but without an endpointId", ()=>{
      const scheduleId = "testId";
      const endpointId = "testEndpointId";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&XXXXXXendpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/",
        reconnect: {retries: 0}
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", (err)=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });

    it("prevents connections with string undefined as a scheduleId", ()=>{
      const scheduleId = "undefined";
      const endpointId = "testEndpointId";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/",
        reconnect: {retries: 0}
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", (err)=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });

    it("prevents connections with string null as a scheduleId", ()=>{
      const scheduleId = "null";
      const endpointId = "testEndpointId";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/",
        reconnect: {retries: 0}
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", (err)=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });

    it("prevents connections with string undefined as an endpointId", ()=>{
      const scheduleId = "testId";
      const endpointId = "undefined";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/",
        reconnect: {retries: 0}
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", (err)=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });

    it("prevents connections with string null as an endpointId", ()=>{
      const scheduleId = "testId";
      const endpointId = "null";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/",
        reconnect: {retries: 0}
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", (err)=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });

    it("allows a connection with proper schedule and endpoint ids", ()=>{
      simple.mock(dbApi.validation, "isValidScheduleId").resolveWith(true);

      const scheduleId = "testId";
      const endpointId = "testEndpointId";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/"
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", res);
        ms.on("error", ()=>rej(Error("Should not have prevented the connection")));
      })
      .then(()=>ms.end());
    });

    it("rejects a connection if schedule id is not valid", ()=>{
      simple.mock(dbApi.validation, "isValidScheduleId").resolveWith(false);

      const scheduleId = "testId";
      const endpointId = "testEndpointId";
      const msUrl = `${msEndpoint}?scheduleId=${scheduleId}&endpointId=${endpointId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/"
      }))(msUrl);

      return new Promise((res, rej)=>{
        ms.on("open", ()=>rej(Error("Should not have allowed the connection")));
        ms.on("error", err=>{console.error(err.message); res()});
      })
      .then(()=>ms.end());
    });
  });
});
