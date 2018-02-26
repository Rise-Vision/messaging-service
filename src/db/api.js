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

      return redis.multi([
        ["setAdd", "connections:id", displayId],
        ["setString", `lastConnection:${displayId}`, Date.now()]
      ]);
    },
    setDisconnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.multi([
        ["setRemove", "connections:id", displayId],
        ["setString", `lastConnection:${displayId}`, Date.now()]
      ]);
    },
    getPresence(ids) {
      return redis.multi(ids.map(id=>["setIsMember", "connections:id", id]))
      .then(resp=>resp.reduce((obj, bool, idx)=>{
        return {
          ...obj,
          [ids[idx]]: {
            connected: Boolean(bool)
          }
        };
      }, {}))
      .then(presenceObj=>{
        const disconnectedDisplays = Object.keys(presenceObj).filter(id=>{
          return presenceObj[id].connected === false;
        });

        return redis.multi(disconnectedDisplays.map(id=>["getString", `lastConnection:${id}`]))
        .then(lastConnections=>{
          disconnectedDisplays.forEach((id, idx)=>{
            presenceObj[id].lastConnection = lastConnections[idx];
          });
          return presenceObj;
        });
      });
    }
  }
};
