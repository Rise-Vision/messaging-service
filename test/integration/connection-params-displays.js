/* eslint-env mocha */
const gcs = require("../../src/gcs.js");
const googlePubSub = require("../../src/google-pubsub");
const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore.js");
const simple = require("simple-mock");
const testPort = 9228;
const Primus = require("primus");
const msEndpoint = `http://localhost:${testPort}/messaging/`;

describe("MS Connection : displays : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();
    simple.mock(datastore, "initdb").returnWith();
    simple.mock(googlePubSub, "publish").returnWith(Promise.resolve());
  });

  after(()=>{
    simple.restore();
  });

  describe("With the messaging server under test running it...", ()=>{
    it("prevents connections without a displayId", ()=>{
      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?XXXXdisplayId=${displayId}&machineId=${machineId}`;
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

    it("prevents connections without a machineId", ()=>{
      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&XXXXXXmachineId=${machineId}`;
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

    it("prevents connections with string undefined as a displayId", ()=>{
      const displayId = "undefined";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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

    it("prevents connections with string null as a displayId", ()=>{
      const displayId = "null";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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

    it("prevents connections with string undefined as a machineId", ()=>{
      const displayId = "testId";
      const machineId = "undefined";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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

    it("prevents connections with string null as a machineId", ()=>{
      const displayId = "testId";
      const machineId = "null";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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

    it("allows a connection with proper display and machine ids", ()=>{
      simple.mock(dbApi.validation, "isValidDisplayId").resolveWith(true);

      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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

    xit("rejects a connection if display id is not valid", ()=>{
      simple.mock(dbApi.validation, "isValidDisplayId").resolveWith(false);

      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
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
