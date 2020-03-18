/* eslint-env mocha */
const gcs = require("../../src/gcs.js");
const datastore = require("../../src/db/redis/datastore.js");
const simple = require("simple-mock");
const db = require("../../src/db/api.js");
const versionCompare = require("../../src/version-compare/api.js");
const Primus = require("primus");
const testPort = 9228;
const msEndpoint = `http://localhost:${testPort}/messaging/`;

describe("MS Display Id : Integration", ()=>{
  before(()=>{
    simple.mock(gcs, "init").returnWith();
    simple.mock(datastore, "initdb").returnWith();
    simple.mock(db.fileMetadata, "addDisplayTo").resolveWith();
    simple.mock(db.watchList, "put").resolveWith();
    simple.mock(versionCompare, "compare").resolveWith({
      matched: true,
      version: -1
    });
  });

  after(()=>{
    simple.restore();
  });

  describe("With the messaging server under test running it...", ()=>{
    it("does not allow messages containing displayId", ()=>{
      const BAD_REQUEST = 400;
      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/"
      }))(msUrl);

      return new Promise((res, rej)=>{
        const watchData = {
          "topic": "watch",
          displayId,
          version: -1,
          "filePath": "messaging-service-test-bucket/test-folder/test-file.txt"
        };

        console.log("Sending:");
        console.dir(watchData);

        ms.on("data", (data)=>{
          console.log(data);
          if (data.error === BAD_REQUEST && data.msg.includes("DisplayId")) {return res();}
          rej(Error("MS should have returned an error"));
        });

        ms.write(watchData);
      });
    });

    it("allows messages if they do not contain displayId", ()=>{
      const displayId = "testId";
      const machineId = "testMachineId";
      const msUrl = `${msEndpoint}?displayId=${displayId}&machineId=${machineId}`;
      console.log(`Connecting to websocket with ${msUrl}`);

      const ms = new (Primus.createSocket({
        transformer: "websockets",
        pathname: "messaging/primus/"
      }))(msUrl);

      return new Promise((res, rej)=>{
        const watchData = {
          topic: "watch",
          version: -1,
          filePath: "messaging-service-test-bucket/test-folder/test-file.txt"
        };

        console.log("Sending:");
        console.dir(watchData);

        ms.on("data", (data)=>{
          console.log(data);
          if (data.msg === "ok") {return res();}
          rej(Error("MS should have processed the WATCH"));
        });

        ms.write(watchData);
      })
      .then(()=>ms.end());
    });
  });
});
