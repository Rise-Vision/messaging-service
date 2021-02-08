/* eslint-env mocha */

const assert = require("assert");
const rp = require("request-promise-native");
const simple = require("simple-mock");

const dbApi = require("../../src/db/api");

const testPort = 9228;
const BAD_REQUEST = 400;
const NOT_AUTHORIZED = 403;

describe("Webhooks : CORE : notify", ()=>{

  it("expects server key", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      console.log(err.message);
      assert(err.message.includes("sk"));
      assert(err.statusCode === NOT_AUTHORIZED);
    });
  });

  it("expects kind parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("kind"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects action parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Display`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("action"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects id parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Display&action=Added`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("Display or schedule id"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects valid kind parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=X&action=Added&id=1234`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("kind"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("expects valid action parameter", ()=>{
    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Display&action=Z&id=1234`,
      json: true
    })
    .then(()=>{
      assert.fail("Should have rejected");
    })
    .catch(err=>{
      assert(err.message.includes("action"));
      assert(err.statusCode === BAD_REQUEST);
    });
  });

  it("responds ok and adds display id", ()=>{
    simple.mock(dbApi.validation, "addDisplayId").resolveWith();

    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Display&action=Added&id=1234`,
      json: true
    })
    .then(()=>{
      const stub = dbApi.validation.addDisplayId;

      assert(stub.called);
      assert.equal(stub.lastCall.args[0], '1234');
    });
  });

  it("responds ok and removes display id", ()=>{
    simple.mock(dbApi.validation, "removeDisplayId").resolveWith();

    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Display&action=Removed&id=1234`,
      json: true
    })
    .then(()=>{
      const stub = dbApi.validation.removeDisplayId;

      assert(stub.called);
      assert.equal(stub.lastCall.args[0], '1234');
    });
  });

  it("responds ok and adds schedule id", ()=>{
    simple.mock(dbApi.validation, "addScheduleId").resolveWith();

    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Schedule&action=Added&id=1234`,
      json: true
    })
    .then(()=>{
      const stub = dbApi.validation.addScheduleId;

      assert(stub.called);
      assert.equal(stub.lastCall.args[0], '1234');
    });
  });

  it("responds ok and removes schedule id", ()=>{
    simple.mock(dbApi.validation, "removeScheduleId").resolveWith();

    return rp({
      method: "GET",
      uri: `http://localhost:${testPort}/messaging/core/idUpdate?sk=TEST&kind=Schedule&action=Removed&id=1234`,
      json: true
    })
    .then(()=>{
      const stub = dbApi.validation.removeScheduleId;

      assert(stub.called);
      assert.equal(stub.lastCall.args[0], '1234');
    });
  });
});
