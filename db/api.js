const redis = require("./redis/datastore.js");

module.exports = {
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      if (!filePath || !displayId) {throw Error("missing params");}
      return redis.setAdd(`meta:${filePath}:displays`, [displayId]);
    },
    getFileVersion(filePath) {
      if (!filePath) {throw Error("missing params");}
      return redis.getString(`meta:${filePath}:version`);
    },
    setFileVersion(filePath, version) {
      if (!filePath) {throw Error("missing params");}
      return redis.setString(`meta:${filePath}:version`, version)
      .then(()=>version);
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
