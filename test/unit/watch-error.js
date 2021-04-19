/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const watchError = require("../../src/event-handlers/watch-error.js");

describe("Watch Error", ()=>{

  describe("Direct (non websocket)", ()=>{

    it("returns 200 on NOEXIST", ()=>{
      const mockError = {message: "NOEXIST"};
      const mockResp = {status: simple.mock().returnWith({send() {}})};

      watchError(mockError, null, null, mockResp);
      assert.equal(mockResp.status.lastCall.arg, 200); // eslint-disable-line no-magic-numbers
    });

    it("returns 500 on error other than NOEXIST", ()=>{
      const mockError = {message: "something unexpected"};
      const mockResp = {status: simple.mock().returnWith({send() {}})};

      watchError(mockError, null, null, mockResp);
      assert.equal(mockResp.status.lastCall.arg, 500); // eslint-disable-line no-magic-numbers
    });
  });
});

