/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const logger = require("../../src/logger.js");
const entry = require("../../src/watchlist/entry.js");

describe("Entry", ()=>{
  beforeEach(()=>{
    simple.mock(logger, "log").returnWith(true);
  });

  afterEach(()=>{
    simple.restore();
  });

  it("allows watchlist entries with no version if filePath is a folder", ()=>{
    const watchlistEntry = {
      displayId: "test", filePath: "my-bucket/my-folder/"
    };

    assert(entry.validate(watchlistEntry));
  });

  it("does not allow watchlist entries with no version if filePath is a file", ()=>{
    const watchlistEntry = {
      displayId: "test", filePath: "my-bucket/my-folder/my-file"
    };

    assert(!entry.validate(watchlistEntry));
  });
});
