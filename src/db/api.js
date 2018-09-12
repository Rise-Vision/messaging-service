const {basename, dirname} = require("path");
const logger = require("../logger");
const redis = require("./redis/datastore");

const patchHashCommand = "patchHash";
const removeHashFieldCommand = "removeHashField";
const setAddCommand = "setAdd";
const setStringCommand = "setString";

let heartbeatExpirySeconds = null;

module.exports = {
  setHeartbeatExpirySeconds(seconds) {
    heartbeatExpirySeconds = seconds;
    logger.log(`Heartbeat records expire in ${heartbeatExpirySeconds} seconds`);
  },
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      if (!filePath || !displayId) {throw Error("missing params");}

      return redis.setAdd(`meta:${filePath}:displays`, [displayId]);
    },
    addDisplaysTo(filePath, displayIds) {
      if (!filePath || !displayIds) {throw Error("missing params");}
      if (!Array.isArray(displayIds)) {throw Error("invalid param");}

      return redis.multi(displayIds.map(display=>{
        return [setAddCommand, `meta:${filePath}:displays`, [display]];
      }));
    },
    addDisplayToMany(filePathsAndVersions, displayId) {
      if (!filePathsAndVersions || !displayId) {throw Error("missing params");}

      const folderPath = `${dirname(filePathsAndVersions[0].filePath)}/`;

      return redis.multi(filePathsAndVersions.map(fileData=>{
        return [setAddCommand, `meta:${fileData.filePath}:displays`, displayId];
      }).concat([[setAddCommand, `meta:${folderPath}:displays`, displayId]]))
      .then(()=>filePathsAndVersions);
    },
    getWatchersFor(filePath) {
      if (!filePath) {throw Error("missing params");}

      const folderPath = `${dirname(filePath)}/`;

      return redis.setUnion([
        `meta:${filePath}:displays`,
        `meta:${folderPath}:displays`
      ]);
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
    setMultipleFileVersions(filePathsAndVersions) {
      if (!filePathsAndVersions) {throw Error("missing params");}

      return Promise.all(filePathsAndVersions.map(fileData=>{
        const key = `meta:${fileData.filePath}:version`;
        return redis.setString(key, fileData.version);
      })).then(()=>filePathsAndVersions);
    },
    getMultipleFileVersions(filePaths) {
      if (!filePaths) {throw Error("missing params");}

      return Promise.all(filePaths.map(filePath=>{
        return module.exports.fileMetadata.getFileVersion(filePath)
        .then(version=>({filePath, version}));
      }));
    },
    deleteMetadata(filePath) {
      return redis.deleteKeys([`meta:${filePath}:displays`, `meta:${filePath}:version`]);
    },
    removeDisplay(filePath, displayId) {
      return redis.setRemove(`meta:${filePath}:displays`, [displayId])
      .then(() => redis.setCount(`meta:${filePath}:displays`))
      .then(count => {
        if (count === 0) {
          return module.exports.fileMetadata.deleteMetadata(filePath);
        }
        return Promise.resolve();
      });
    },
    hasMetadata(filePath) {
      return redis.hasKey(`meta:${filePath}:version`);
    }
  },
  watchList: {
    get(displayId) {
      return redis.getHash(`watch:${displayId}`);
    },
    put(entry) {
      if (!entry) {throw Error("missing params");}

      return redis.patchHash(`watch:${entry.displayId}`, {
        [entry.filePath]: entry.version
      })
      .then(() => module.exports.watchList.updateLastChanged(entry.displayId));
    },
    putFolder(filePathsAndVersions, displayId) {
      if (!filePathsAndVersions || !displayId) {throw Error("missing params");}

      const folderPath = `${dirname(filePathsAndVersions[0].filePath)}/`;
      const multipleEntryObj = filePathsAndVersions.reduce((obj, fileData)=>{
        return {...obj, [fileData.filePath]: fileData.version};
      }, {[folderPath]: "0"});

      return redis.patchHash(`watch:${displayId}`, multipleEntryObj)
      .then(()=>module.exports.watchList.updateLastChanged(displayId))
      .then(()=>filePathsAndVersions);
    },
    removeEntry(filePath, displays) { // eslint-disable TODO remove
      const lastChanged = Date.now();

      return redis.multi(displays.map(display=>{
        return [removeHashFieldCommand, `watch:${display}`, filePath];
      }).concat(displays.map(display=>{
        return [setStringCommand, `last_changed:${display}`, lastChanged];
      })));
    },
    unwatch(displayId, filePaths) {
      return redis.removeHashFields(`watch:${displayId}`, filePaths)
        .then(removed => {
          if (removed > 0) {
            return redis.setString(`last_changed:${displayId}`, Date.now());
          }
        })
        .then(() => {
          return Promise.all(filePaths.map(filePath => module.exports.fileMetadata.removeDisplay(filePath, displayId)));
        });
    },
    updateVersion(filePath, version, displays) {
      const patch = {[filePath]: version};
      const lastChanged = Date.now();

      return redis.multi(displays.map(display=>{
        return [patchHashCommand, `watch:${display}`, patch];
      }).concat(displays.map(display=>{
        return [setStringCommand, `last_changed:${display}`, lastChanged];
      })));
    },
    updateLastChanged(displayId) {
      return redis.setString(`last_changed:${displayId}`, Date.now());
    },
    lastChanged(displayId) {
      return redis.getString(`last_changed:${displayId}`)
      .then(lastChanged => lastChanged || '0');
    }
  },
  connections: {
    setConnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.multi([
        [setStringCommand, `connections:id:${displayId}`, 1, "EX", heartbeatExpirySeconds],
        [setStringCommand, `lastConnection:${displayId}`, Date.now()]
      ]);
    },
    recordHeartbeat(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.setString(`connections:id:${displayId}`, 1, "EX", heartbeatExpirySeconds);
    },
    setLastConnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.setString(`lastConnection:${displayId}`, Date.now());
    },
    getPresence(ids) {
      return redis.multi(ids.map(id=>["getString", `connections:id:${id}`]))
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
  },
  folders: {
    addFileNames(folderPath, filePathsAndVersions) {
      const files = filePathsAndVersions.map(data=>basename(data.filePath));

      return redis.setAdd(`folders:${folderPath}`, files)
      .then(()=>filePathsAndVersions);
    },
    removeFileFromFolder(filePath) {
      const folderPath = `${dirname(filePath)}/`;
      const fileName = basename(filePath);

      return redis.setRemove(`folders:${folderPath}`, [fileName]);
    },
    addFileToFolder(data) {
      const folderPath = `${dirname(data.filePath)}/`;
      const fileName = basename(data.filePath);

      return redis.setAdd(`folders:${folderPath}`, [fileName])
      .then(()=>({...data, addedIntoFolder: true}));
    },
    filePathsAndVersionsFor(folderPath) {
      return redis.getSet(`folders:${folderPath}`)
      .then(fileNames=>fileNames.map(fileName=>folderPath.concat(fileName)))
      .then(module.exports.fileMetadata.getMultipleFileVersions);
    },
    watchingFolder(filePathOrFolderPath) {
      const folderPath = filePathOrFolderPath.endsWith("/") ?
        filePathOrFolderPath :
        `${dirname(filePathOrFolderPath)}/`;

      return redis.keyExists(`meta:${folderPath}:displays`);
    },
    folderHasBeenReset(folderPath) {
      return redis.setHas(`folders:cleared`, folderPath)
    },
    clearFolderFiles(folderPath) {
      return redis.deleteKeys([`folders:${folderPath}`])
      .then(()=>redis.setAdd(`folders:cleared`, [folderPath]))
      .then(()=>folderPath)
    }
  }
};
