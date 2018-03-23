/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");

const dbApi = require("../../src/db/api");
const datastore = require("../../src/db/redis/datastore");

describe("DB API : Integration", ()=>{
  before(()=>{
    datastore.initdb();
  });

  beforeEach(()=>{
    return datastore.eraseEntireDb();
  });

  afterEach(() => simple.restore());

  it("updates and retrieves last changed value", ()=>{
    const fakeTimestamp = 12345;

    simple.mock(Date, "now").returnWith(fakeTimestamp);

    return dbApi.watchList.updateLastChanged("ABC124")
    .then(() => dbApi.watchList.lastChanged("ABC124"))
    .then(lastChanged => assert.equal(lastChanged, fakeTimestamp));
  });

  it("retrieves last changed value even if it was not set before", ()=>{
    return dbApi.watchList.lastChanged("ABC124")
    .then(lastChanged => assert.equal(lastChanged, '0'));
  });

});
