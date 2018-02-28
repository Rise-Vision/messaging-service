/* eslint-env mocha */
const assert = require("assert");
const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore");
const fileStatusUpdate = require("../../src/file-status-update");

describe("Pubsub Update : Integration", ()=>{
  before(()=>{
    datastore.initdb();
  });

  beforeEach(()=>{
    return datastore.eraseEntireDb();
  });

  it("deletes from watchlist and metadata on DELETE message type", ()=>{
    const filePath = "my-bucket/my-file";
    const version = "12345";
    const displayId = "test-id";

    return dbApi.watchList.put({filePath, version, displayId})
    .then(datastore.getHash.bind(null, `watch:${displayId}`))
    .then(map=>assert.deepEqual(map, {[filePath]: version}))
    .then(()=>{
      return dbApi.fileMetadata.addDisplayTo(filePath, displayId)
      .then(dbApi.fileMetadata.setFileVersion.bind(null, filePath, version));
    })
    .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
    .then(set=>assert(set.includes(displayId)))
    .then(datastore.getString.bind(null, `meta:${filePath}:version`))
    .then(dbVersion=>assert.equal(dbVersion, version))
    .then(()=>{
      return fileStatusUpdate.processUpdate(JSON.stringify({
        filePath,
        version,
        type: "DELETE",
        podname: process.env.podname
      }))
    })
    .then(()=>{
      return datastore.getHash(`watch:${displayId}`)
      .then(map=>assert.deepEqual(map, null))
      .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
      .then(set=>assert(!set.includes(displayId)))
      .then(datastore.getString.bind(null, `meta:${filePath}:version`))
      .then(dbVersion=>assert(!dbVersion));
    })
  });

  it("saves to watchlist and metadata on ADD/UPDATE message type", ()=>{
    const filePath = "my-bucket/my-file";
    const version = "12345";
    const updatedVersion = "54321";
    const displayId = "test-id";

    return datastore.getHash(`watch:${displayId}`)
    .then(map=>assert.deepEqual(map, null))
    .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
    .then(set=>assert(!set.includes(displayId)))
    .then(datastore.getString.bind(null, `meta:${filePath}:version`))
    .then(dbVersion=>assert(!dbVersion))
    .then(()=>{
      return dbApi.watchList.put({filePath, version, displayId})
      .then(dbApi.fileMetadata.addDisplayTo.bind(null, filePath, displayId))
    })
    .then(()=>{
      return fileStatusUpdate.processUpdate(JSON.stringify({
        filePath,
        version: updatedVersion,
        type: "ADD",
        podname: process.env.podname
      }))
    })
    .then(()=>{
      return datastore.getHash(`watch:${displayId}`)
      .then(map=>assert.deepEqual(map, {[filePath]: updatedVersion}))
      .then(datastore.getSet.bind(null, `meta:${filePath}:displays`))
      .then(set=>assert(set.includes(displayId)))
      .then(datastore.getString.bind(null, `meta:${filePath}:version`))
      .then(dbVersion=>assert.equal(dbVersion, updatedVersion))
    });
  });
});
