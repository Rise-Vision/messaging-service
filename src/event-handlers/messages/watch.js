const db = require("../../db/api.js");
const makeToken = require("../../token/make-token.js");
const versionCompare = require("../../version-compare/api.js");
const watchListEntry = require("../../watchlist/entry.js");
const watchError = require("../watch-error.js");
const displayConnections = require("../display-connections");
const logger = require("../../logger.js");

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "WATCH" &&
      data.filePath && !data.filePath.endsWith("/");
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
      const watchlistUpdate = finalResult.token ?
        db.watchList.put({filePath, displayId, version: finalResult.version}) :
        Promise.resolve();

      return watchlistUpdate
      .then(()=>db.watchList.lastChanged(displayId))
      .then(watchlistLastChanged =>
        displayConnections.sendMessage(displayId, {
          msg: "ok",
          topic: "watch-result",
          filePath,
          version: finalResult.version,
          token: finalResult.token,
          watchlistLastChanged
        }));
    })
    .catch((err)=>{
      watchError(err, filePath, newEntry.displayId);
    });
  }
};
