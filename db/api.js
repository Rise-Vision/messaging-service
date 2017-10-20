const redis = require("./redis/datastore.js");
const hash = require("./hasher.js");

module.exports = {
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      if (!filePath || !displayId) {throw Error("missing params");}
      return redis.setAdd(`meta:${hash(filePath)}:displays`, [displayId]);
    }
  },
  watchList: {
    put(entry) {
      if (!entry) {throw Error("missing params");}

      return redis.patchHash(`watch:${entry.displayId}`, {
        [entry.filePath]: entry.version
      });
    }
  }
};
