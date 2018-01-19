const db = require("../db/api.js");
const makeToken = require("../token/make-token.js");
const folderWatch = require("./folder-watch.js");
const watchError = require("./watch-error.js");
const versionCompare = require("../version-compare/api.js");
const watchListEntry = require("../watchlist/entry.js");
const logger = require("../logger.js");

module.exports = function watch(newEntry) {
  if (newEntry && newEntry.version) {newEntry.version = String(newEntry.version)}

  if (!watchListEntry.validate(newEntry)) {

    logger.log(`Invalid entry`);
    return Promise.resolve({
      error: 400,
      msg: `invalid watchlist entry ${JSON.stringify(newEntry)}`
    });
  }

  const {filePath, displayId} = newEntry;

  if (watchListEntry.filePathIsFolder(filePath)) {return folderWatch(newEntry);}

  const asyncTasks = [
    db.fileMetadata.addDisplayTo(filePath, displayId),
    db.watchList.put(newEntry),
    versionCompare.compare(newEntry).then(ver=>{
      return ver.matched ? ver : makeToken(ver)
    })
  ];

  return Promise.all(asyncTasks)
  .then(all=>{
    const finalResult = all[asyncTasks.length - 1];
    return {
      msg: "ok",
      topic: "watch-result",
      filePath,
      version: finalResult.version,
      token: finalResult.token
    };
  })
  .catch((err)=>{
    return watchError(err, filePath, JSON.stringify(newEntry));
  });
};
