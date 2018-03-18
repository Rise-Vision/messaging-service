const redis = require("./redis/datastore.js");

module.exports = {
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      if (!filePath || !displayId) {throw Error("missing params");}

      return redis.setAdd(`meta:${filePath}:displays`, [displayId]);
    },
    addDisplayToMany(filePathsAndVersions, displayId) {
      if (!filePathsAndVersions || !displayId) {throw Error("missing params");}

      const command = "setAdd";

      return redis.multi(filePathsAndVersions.map(fileData=>{
        return [command, `meta:${fileData.filePath}:displays`, displayId];
      }))
      .then(()=>filePathsAndVersions);
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
      });
    },
    putFolderData(filePathsAndVersions, displayId) {
      if (!filePathsAndVersions || !displayId) {throw Error("missing params");}

      const multipleEntryObj = filePathsAndVersions.reduce((obj, fileData)=>{
        return {...obj, [fileData.filePath]: fileData.version};
      }, {});

      return redis.patchHash(`watch:${displayId}`, multipleEntryObj)
      .then(()=>filePathsAndVersions);
    },
    removeEntry(filePath, displays) {
      const command = "removeHashField";

      return redis.multi(displays.map(display=>{
        return [command, `watch:${display}`, filePath];
      }));
    },
    updateVersion(filePath, version, displays) {
      const patch = {[filePath]: version};
      const command = "patchHash";

      return redis.multi(displays.map(display=>{
        return [command, `watch:${display}`, patch];
      }));
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
  },
  folders: {
    addFileNames(folderPath, filePathsAndVersions) {
      const simpleFileNames = filePathsAndVersions.map(data=>{
        const fileNameIndex = -1;
        return data.filePath.split("/").slice(fileNameIndex)[0];
      });

      return redis.setAdd(`folders:${folderPath}`, simpleFileNames)
      .then(()=>filePathsAndVersions);
    },
    filePathsAndVersionsFor(folderPath) {
      return redis.getSet(`folders:${folderPath}`)
      .then(fileNames=>fileNames.map(fileName=>folderPath.concat(fileName)))
      .then(module.exports.fileMetadata.getMultipleFileVersions);
    },
    watchingFolder(folder) {
      return redis.keyExists(`folders:${folder}`);
    }
  }
};
