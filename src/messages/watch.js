const db = require("../db/api.js");
const makeToken = require("../token/make-token.js");
const versionCompare = require("../version-compare/api.js");
const watchListEntry = require("../watchlist/entry.js");
const logger = require("../logger.js");

module.exports = function watch(newEntry) {
  if (!watchListEntry.validate(newEntry)) {

    logger.log(`Invalid entry`);
    return Promise.resolve({
      error: 400,
      msg: `invalid watchlist entry ${JSON.stringify(newEntry)}`
    });
  }

  const {filePath, displayId} = newEntry;
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
    console.error(err);

    return {
      error: err.code,
      topic: "watch-result",
      filePath,
      msg: `There was an error processing WATCH:${JSON.stringify(newEntry)}`,
      detail: err.message
    };
  });
};
