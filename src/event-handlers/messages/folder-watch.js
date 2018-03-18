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
  doOnIncomingPod({filePath: folderPath, displayId} = {}) {
    return folders.watchingFolder(folderPath)
    .then(watching=>{
      return watching ? existingFolder(folderPath) : newFolder(folderPath);
    })
    .then(filePathsAndVersions=>{
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
      displayConnections.sendMessage(displayId, {
        msg: "ok",
        topic: "watch-result",
        folderData
      });
    })
    .catch((err)=>{
      watchError(err, folderPath, displayId);
    });
  }
};

function existingFolder(folderPath) {
  return folders.filePathsAndVersionsFor(folderPath);
}

function newFolder(folderPath) {
  return gcs.getFiles(folderPath)
  .then(objectNamesAndVersions=>{
    const filePathsAndVersions = objectNamesAndVersions
    .map(({name, generation})=>{
      return {
        filePath: `${folderPath}${name.split("/")[1]}`,
        version: generation
      };
    });

    return md.setMultipleFileVersions(filePathsAndVersions)
    .then(folders.addFileNames.bind(null, folderPath));
  });
}
