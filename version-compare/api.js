const watchListEntry = require("../watchlist/entry.js");
const {fileMetadata: md} = require("../db/api.js");
const gcs = require("./gcs.js");

module.exports = {
  compare(newEntry) {
    if (!watchListEntry.validate(newEntry)) {throw Error("invalid entry");}

    const {displayId, filePath, version: checkVersion} = newEntry;

    return md.getFileVersion(filePath)
    .then(version=>version ||
      gcs.version(filePath).then(md.setFileVersion.bind(null, filePath)))
    .then((version)=>({
      matched: version === checkVersion, version, filePath, displayId
    }));
  }
};
