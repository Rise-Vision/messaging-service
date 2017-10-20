const db = require("../db/api.js");
const watchListEntry = require("../watchlist/entry.js");

module.exports = function watch(newEntry, needsToken = false) {
  if (!watchListEntry.validate(newEntry)) {
    throw Error(`invalid watchlist entry ${newEntry}`);
  }

  const {filePath, displayId} = newEntry;

  return needsToken || Promise.all([
    db.fileMetadata.addDisplayTo(filePath, displayId),
    db.watchList.put(newEntry)
  ])
  .catch((err)=>{
    console.error(err);
    return {error: 500, msg: "There was an error processing WATCH."};
  });
};
