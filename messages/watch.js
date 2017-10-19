const db = require("../db/api.js");
const watchListEntry = require("../watchlist/entry.js");

module.exports = {
  watch(newEntry, needsToken = false) {
    if (!watchListEntry.validate(newEntry)) {
      throw Error("invalid watchlist entry");
    }

    const {filePath, displayId} = newEntry;

    db.fileMetadata.addDisplayTo(filePath, displayId);
    db.watchList.put(newEntry);

    return true;
  }
};
