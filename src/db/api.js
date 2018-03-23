const {basename, dirname} = require("path");
const redis = require("./redis/datastore.js");

const getSetCommand = "getSet";
const patchHashCommand = "patchHash";
const removeHashFieldCommand = "removeHashField";
const setAddCommand = "setAdd";
const setRemoveCommand = "setRemove";
const setStringCommand = "setString";

module.exports = {
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

      return redis.multi([
        [getSetCommand, `meta:${filePath}:displays`],
        [getSetCommand, `meta:${folderPath}:displays`]
      ]).then(resp=>resp[0].concat(resp[1]));
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
      return redis.deleteKey([`meta:${filePath}:displays`, `meta:${filePath}:version`]);
    },
    hasMetadata(filePath) {
      return redis.hasKey(`meta:${filePath}:version`);
    }
  },
  watchList: {
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
    removeEntry(filePath, displays) {
      const lastChanged = Date.now();

      return redis.multi(displays.map(display=>{
        return [removeHashFieldCommand, `watch:${display}`, filePath];
      }).concat(displays.map(display=>{
        return [setStringCommand, `last_changed:${display}`, lastChanged];
      })));
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
      return redis.getString(`last_changed:${displayId}`);
    }
  },
  connections: {
    setConnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.multi([
        [setAddCommand, "connections:id", displayId],
        [setStringCommand, `lastConnection:${displayId}`, Date.now()]
      ]);
    },
    setDisconnected(displayId) {
      if (!displayId) {return Promise.reject(Error("missing displayId"));}

      return redis.multi([
        [setRemoveCommand, "connections:id", displayId],
        [setStringCommand, `lastConnection:${displayId}`, Date.now()]
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

      return redis.keyExists(`folders:${folderPath}`);
    }
  }
};
