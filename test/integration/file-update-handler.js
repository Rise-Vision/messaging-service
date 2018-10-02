/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");

const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore");
const fileUpdateHandler = require("../../src/event-handlers/messages/gcs-file-update");
const folderWatch = require("../../src/event-handlers/messages/folder-watch");

describe("GCS File Update : Integration", ()=>{
  const fakeTimestamp = 123456;
  const fakeTimestamp2 = 234567;
  const fakeTimestamp3 = 345679;

  before(()=>{
    datastore.initdb();
  });

  beforeEach(()=>{
    return datastore.eraseEntireDb();
  });

  afterEach(() => simple.restore());

  it("saves to watchlist and metadata on ADD/UPDATE message type", ()=>{
    const filePath = "my-bucket/my-file";
    const version = "12345";
    const updatedVersion = "54321";
    const displayId = "test-id";

    return dbApi.watchList.updateLastChanged(displayId)
    .then(()=>datastore.getHash(`watch:${displayId}`))
    .then(map=>assert.deepEqual(map, null))
    .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
    .then(set=>assert(!set.includes(displayId)))
    .then(datastore.getString.bind(null, `meta:${filePath}:version`))
    .then(dbVersion=>assert(!dbVersion))
    .then(()=>{
      simple.mock(Date, "now").returnWith(fakeTimestamp);

      return dbApi.watchList.put({filePath, version, displayId})
      .then(dbApi.fileMetadata.addDisplayTo.bind(null, filePath, displayId))
      .then(dbApi.fileMetadata.setFileVersion.bind(null, filePath, version))
    })
    .then(() => dbApi.watchList.lastChanged(displayId))
    .then(lastChanged => {
      assert.equal(lastChanged, fakeTimestamp);

      simple.mock(Date, "now").returnWith(fakeTimestamp2);

      return fileUpdateHandler.doOnIncomingPod({
        filePath,
        version: updatedVersion,
        type: "ADD",
        podname: process.env.podname
      })
    })
    .then(()=>{
      return datastore.getHash(`watch:${displayId}`)
      .then(map=>assert.deepEqual(map, {[filePath]: updatedVersion}))
      .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
      .then(set=>assert(set.includes(displayId)))
      .then(datastore.getString.bind(null, `meta:${filePath}:version`))
      .then(dbVersion=>assert.equal(dbVersion, updatedVersion))
    })
    .then(() => dbApi.watchList.lastChanged(displayId))
    .then(lastChanged => assert.equal(lastChanged, fakeTimestamp2));
  });

  it("returns files in folder on watch, updates metadata when a file is ADDED / DELETED", ()=>{
    const folderPathToWatch = "messaging-service-test-bucket/test-folder/";
    const preExistingGCSFile = "messaging-service-test-bucket/test-folder/test-file.txt";
    const preExistingGCSFileVersion = "1509655894026319";
    const newFile = "messaging-service-test-bucket/test-folder/fake-new-file.txt";
    const newFileVersion = "12345";
    const displayId = "test-id";

    console.log(`Sending folder watch for ${folderPathToWatch}`);

    return dbApi.watchList.updateLastChanged(displayId)
    .then(() => {
      simple.mock(Date, "now").returnWith(fakeTimestamp);

      return folderWatch.doOnIncomingPod({filePath: folderPathToWatch, displayId});
    })
    .then(()=>datastore.getHash(`watch:${displayId}`))
    .then(map=>{
      assert.equal(map[preExistingGCSFile], preExistingGCSFileVersion);
      assert.equal(map[folderPathToWatch], "0");

      return dbApi.watchList.lastChanged(displayId);
    })
    .then(lastChanged => {
      assert.equal(lastChanged, fakeTimestamp);

      simple.mock(Date, "now").returnWith(fakeTimestamp2);

      return fileUpdateHandler.doOnIncomingPod({
        filePath: newFile,
        version: newFileVersion,
        type: "ADD"
      });
    })
    .then(datastore.getSet.bind(null, `meta:${newFile}:displays`))
    .then(set=>assert(set.includes(displayId)))
    .then(datastore.getHash.bind(null, `watch:${displayId}`))
    .then(map=>{
      assert.equal(map[preExistingGCSFile], preExistingGCSFileVersion);
      assert.equal(map[folderPathToWatch], "0");
      assert.equal(map[newFile], "12345");
    })
    .then(datastore.getSet.bind(null, `folders:${folderPathToWatch}`))
    .then(set => {
      assert(set.includes("fake-new-file.txt"));

      return dbApi.watchList.lastChanged(displayId);
    })
    .then(lastChanged => {
      assert.equal(lastChanged, fakeTimestamp2);

      simple.mock(Date, "now").returnWith(fakeTimestamp3);

      return fileUpdateHandler.doOnIncomingPod({
        filePath: newFile,
        version: newFileVersion,
        type: "DELETE"
      });
    })
    .then(datastore.getSet.bind(null, `folders:${folderPathToWatch}`))
    .then(set=>assert(!set.includes("fake-new-file.txt")))
    .then(datastore.getHash.bind(null, `watch:${displayId}`))
    .then(map=>{
      assert.equal(map[preExistingGCSFile], preExistingGCSFileVersion);
      assert.equal(map[folderPathToWatch], "0");
      assert.ok(map[newFile], "12345");
    })
    .then(datastore.getSet.bind(null, `meta:${newFile}:displays`))
    .then(set=>assert(set.includes(displayId)))
    .then(() => dbApi.watchList.lastChanged(displayId))
    .then(lastChanged => assert.equal(lastChanged, fakeTimestamp3));
  });
});
