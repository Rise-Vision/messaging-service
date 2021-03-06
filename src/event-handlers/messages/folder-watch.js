const makeToken = require("../../token/make-token.js");
const watchError = require("../watch-error.js");
const displayConnections = require("../display-connections");
const gcs = require("../../gcs.js");
const {folders, fileMetadata: md, watchList} = require("../../db/api.js");

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "WATCH" &&
      data.filePath && data.filePath.endsWith("/");
  },
  doOnIncomingPod({filePath: folderPath, displayId} = {}, resp) {
    return folders.watchingFolder(folderPath)
    .then(watching=>{
      return watching ? existingFolder(folderPath) : newFolder(folderPath);
    })
    .then(filePathsAndVersions=>{
      if (!filePathsAndVersions.length) {
        return Promise.reject(Error("EMPTYFOLDER"));
      }

      return Promise.all([
        md.addDisplayToMany(filePathsAndVersions, displayId),
        watchList.putFolder(filePathsAndVersions, displayId)
      ]);
    })
    .then(all=>{
      return all[0].map(filePathAndVersion=>{
        return makeToken({displayId, ...filePathAndVersion});
      });
    })
    .then((folderData)=>{
      return watchList.lastChanged(displayId)
      .then(watchlistLastChanged => {
        const message = {
          msg: "ok",
          topic: "watch-result",
          folderData,
          watchlistLastChanged
        };

        return resp ? resp.send(message) : displayConnections.sendMessage(displayId, message);
      })
    })
    .catch((err)=>{
      watchError(err, folderPath, displayId, resp);
    });
  }
};

function existingFolder(folderPath) {
  return folders.folderHasBeenReset(folderPath)
  .then(alreadyReset=>{
    return alreadyReset ? folders.filePathsAndVersionsFor(folderPath) :
    resetFolder(folderPath)
  })
}

function resetFolder(folderPath) {
  return folders.clearFolderFiles(folderPath)
  .then(newFolder)
}

function newFolder(folderPath) {
  const bucket = folderPath.split("/")[0];

  return folders.clearFolderFiles(folderPath)
  .then(gcs.getFiles)
  .then(objectNamesAndVersions=>{
    const filePathsAndVersions = objectNamesAndVersions
    .map(({name, generation})=>{
      return {
        filePath: `${bucket}/${name}`,
        version: generation
      };
    });

    return md.setMultipleFileVersions(filePathsAndVersions)
    .then(folders.addFileNames.bind(null, folderPath));
  });
}
