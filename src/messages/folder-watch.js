const makeToken = require("../token/make-token.js");
const watchError = require("./watch-error.js");
const gcs = require("../gcs.js");
const {folders, fileMetadata: md, watchList} = require("../db/api.js");

module.exports = function({filePath: folderPath, displayId} = {}) {
  return folders.watchingFolder(folderPath)
  .then(res=>{
    return res ? existingFolder(folderPath) : newFolder(folderPath);
  })
  .then(filePathsAndVersions=>{
    return Promise.all([
      md.addDisplayToMany(filePathsAndVersions, displayId),
      watchList.putFolderData(filePathsAndVersions, displayId)
    ]);
  })
  .then(all=>{
    return all[0].map(filePathAndVersion=>{
      return makeToken({displayId, ...filePathAndVersion});
    });
  })
  .then((folderData)=>{
    return {
      msg: "ok",
      topic: "watch-result",
      folderData
    };
  })
  .catch((err)=>{
    return watchError(err, folderPath, folderPath);
  });
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
