const db = require("../../db/api.js");
const makeToken = require("../../token/make-token.js");
const versionCompare = require("../../version-compare/api.js");
const watchListEntry = require("../../watchlist/entry.js");
const displayConnections = require("../display-connections");
const logger = require("../../logger.js");

module.exports = {
  canHandle(data) {
    return data.topic && data.topic.toUpperCase() === "WATCH";
  },
  doOnIncomingPod(newEntry) {
    if (newEntry && newEntry.version) {newEntry.version = String(newEntry.version)}

    if (!watchListEntry.validate(newEntry)) {

      logger.log(`Invalid entry`);

      return newEntry && displayConnections.sendMessage(newEntry.displayId, {
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
      displayConnections.sendMessage(newEntry.displayId, {
        msg: "ok",
        topic: "watch-result",
        filePath,
        version: finalResult.version,
        token: finalResult.token
      });
    })
    .catch((err)=>{
      console.error(newEntry, err);

      displayConnections.sendMessage(displayId, {
        error: err.code,
        topic: "watch-result",
        filePath,
        msg: `There was an error processing WATCH:${JSON.stringify(newEntry)}`,
        detail: err.message
      });
    });
  }
};
