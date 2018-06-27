/* eslint-env mocha */
const assert = require("assert");
const simple = require("simple-mock");
const db = require("../../src/db/api.js");
const gcs = require("../../src/gcs.js");

const versionCompare = require("../../src/version-compare/api.js");

describe("Version Compare", () => {

  afterEach(()=>{
    simple.restore();
  });

  it("should match same version from database", () => {
    const entry = {displayId: "OM2310SH3299", version: "1", filePath: "test-bucket/test-file.png"};

    simple.mock(db.fileMetadata, "getFileVersion").resolveWith(entry.version);

    return versionCompare.compare(entry)
    .then(result => {
      assert.deepEqual(result, {
        matched: true,
        displayId: entry.displayId,
        version: entry.version,
        filePath: entry.filePath
      });
    });
  });

  it("should not match different version from database", () => {
    const entry = {displayId: "OM2310SH3299", version: "1", filePath: "test-bucket/test-file.png"};

    simple.mock(db.fileMetadata, "getFileVersion").resolveWith("2");

    return versionCompare.compare(entry)
    .then(result => {
      assert.deepEqual(result, {
        matched: false,
        displayId: entry.displayId,
        version: "2",
        filePath: entry.filePath
      });
    });
  });

  it("should request version from gcs when no database version is found", () => {
    const entry = {displayId: "OM2310SH3299", version: "1", filePath: "test-bucket/test-file.png"};

    simple.mock(db.fileMetadata, "getFileVersion").resolveWith(null);
    simple.mock(gcs, "version").resolveWith("1");
    simple.mock(db.fileMetadata, "setFileVersion").resolveWith("1");

    return versionCompare.compare(entry)
    .then(result => {
      assert.deepEqual(result, {
        matched: true,
        displayId: entry.displayId,
        version: entry.version,
        filePath: entry.filePath
      });
      assert.equal(db.fileMetadata.setFileVersion.called, true);
    });
  });

  it("should reject when gcs rejects", () => {
    const entry = {displayId: "OM2310SH3299", version: "1", filePath: "test-bucket/test-file.png"};

    simple.mock(db.fileMetadata, "getFileVersion").resolveWith(null);
    simple.mock(gcs, "version").rejectWith(new Error("GCS Error"));
    simple.mock(db.fileMetadata, "setFileVersion");

    return versionCompare.compare(entry)
    .then(() => assert.fail("should have been rejected"))
    .catch(err => {
      assert.equal(err.message, "GCS Error");
      assert.equal(db.fileMetadata.setFileVersion.called, false);
    });
  });

  it("should set version to 0 in the database when gcs rejects with NOEXIST error", () => {
    const entry = {displayId: "OM2310SH3299", version: "1", filePath: "test-bucket/test-file.png"};

    simple.mock(db.fileMetadata, "getFileVersion").resolveWith(null);
    simple.mock(gcs, "version").rejectWith(new Error("NOEXIST"));
    simple.mock(db.fileMetadata, "setFileVersion").resolveWith("0");

    return versionCompare.compare(entry)
    .then(() => assert.fail("should have been rejected"))
    .catch(err => {
      assert.equal(err.message, "NOEXIST");
      assert.equal(db.fileMetadata.setFileVersion.called, true);
      assert.equal(db.fileMetadata.setFileVersion.lastCall.args[1], "0");
    });
  });

});
