const redis = require("./redis/datastore.js");

module.exports = {
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      if (!filePath || !displayId) {throw Error("missing params");}
      return redis.setAdd(`meta:${filePath}:displays`, [displayId]);
    },
    getWatchersFor(filePath) {
      if (!filePath) {throw Error("missing params");}
      return redis.getSet(`meta:${filePath}:displays`);
    },
    getFileVersion(filePath) {
      if (!filePath) {throw Error("missing params");}
      return redis.getString(`meta:${filePath}:version`);
    },
    setFileVersion(filePath, version) {
      if (!filePath) {throw Error("missing params");}
      return redis.setString(`meta:${filePath}:version`, version)
      .then(()=>version);
    },
    deleteMetadata(filePath) {
      return redis.deleteKey([`meta:${filePath}:displays`, `meta:${filePath}:version`]);
    }
  },
  watchList: {
    put(entry) {
      if (!entry) {throw Error("missing params");}

      return redis.patchHash(`watch:${entry.displayId}`, {
        [entry.filePath]: entry.version
      });
    },
    removeEntry(filePath, displays) {
      displays.forEach(display=>{
        redis.removeHashField(`watch:${display}`, filePath);
      });
    },
    updateVersion(filePath, version, displays) {
      displays.forEach(display=>{
        redis.patchHash(`watch:${display}`, {
          [filePath]: version
        });
      });
    }
  },
  connections: {
    setConnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.setAdd("connections:id", [displayId]);
    },
    setDisconnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.setRemove("connections:id", [displayId]);
    },
    getPresence(ids) {
      return Promise.resolve(ids);
    }
  }
};
