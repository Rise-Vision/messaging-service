/* eslint-env mocha */

const assert = require("assert");
const rp = require("request-promise-native");
const simple = require("simple-mock");

const dbApi = require("../../src/db/api");

const testPort = 9228;
const BAD_REQUEST = 400;
const NOT_AUTHORIZED = 403;

const TEST_AUTHORIZATION = {Authorization: 'BASIC VEVTVA=='}

describe("Webhooks : enpoints", ()=>{

  describe("ban", ()=>{
    it("expects Basic header", ()=>{
      return rp({
        method: "GET",
        uri: `http://localhost:${testPort}/messaging/ban`,
        json: true
      })
      .then(()=>{
        assert.fail("Should have rejected");
      })
      .catch(err=>{
        assert(err.message.includes("Not authorized"));
        assert(err.statusCode === NOT_AUTHORIZED);
      });
    });

    it("expects id parameter", ()=>{
      return rp({
        method: "GET",
        headers: TEST_AUTHORIZATION,
        uri: `http://localhost:${testPort}/messaging/ban`,
        json: true
      })
      .then(()=>{
        assert.fail("Should have rejected");
      })
      .catch(err=>{
        assert(err.message.includes("Endpoint or display id"));
        assert(err.statusCode === BAD_REQUEST);
      });
    });

    it("responds ok and bans id with empty reason", ()=>{
      simple.mock(dbApi.validation, "banEndpointId").resolveWith();

      return rp({
        method: "GET",
        headers: TEST_AUTHORIZATION,
        uri: `http://localhost:${testPort}/messaging/ban?id=1234`,
        json: true
      })
      .then(()=>{
        const stub = dbApi.validation.banEndpointId;

        assert(stub.called);
        assert.equal(stub.lastCall.args[0], '1234');
        assert.equal(stub.lastCall.args[1], '');
      });
    });

    it("responds ok and bans id with explicit reason", ()=>{
      simple.mock(dbApi.validation, "banEndpointId").resolveWith();

      return rp({
        method: "GET",
        headers: TEST_AUTHORIZATION,
        uri: `http://localhost:${testPort}/messaging/ban?id=1234&reason=Abuse`,
        json: true
      })
      .then(()=>{
        const stub = dbApi.validation.banEndpointId;

        assert(stub.called);
        assert.equal(stub.lastCall.args[0], '1234');
        assert.equal(stub.lastCall.args[1], 'Abuse');
      });
    });
  });

  describe("unban", ()=>{
    it("expects Basic header", ()=>{
      return rp({
        method: "GET",
        uri: `http://localhost:${testPort}/messaging/unban`,
        json: true
      })
      .then(()=>{
        assert.fail("Should have rejected");
      })
      .catch(err=>{
        assert(err.message.includes("Not authorized"));
        assert(err.statusCode === NOT_AUTHORIZED);
      });
    });

    it("expects id parameter", ()=>{
      return rp({
        method: "GET",
        headers: TEST_AUTHORIZATION,
        uri: `http://localhost:${testPort}/messaging/unban`,
        json: true
      })
      .then(()=>{
        assert.fail("Should have rejected");
      })
      .catch(err=>{
        assert(err.message.includes("Endpoint or display id"));
        assert(err.statusCode === BAD_REQUEST);
      });
    });

    it("responds ok and unbans id", ()=>{
      simple.mock(dbApi.validation, "unbanEndpointId").resolveWith();

      return rp({
        method: "GET",
        headers: TEST_AUTHORIZATION,
        uri: `http://localhost:${testPort}/messaging/unban?id=1234`,
        json: true
      })
      .then(()=>{
        const stub = dbApi.validation.unbanEndpointId;

        assert(stub.called);
        assert.equal(stub.lastCall.args[0], '1234');
      });
    });
  });

});
