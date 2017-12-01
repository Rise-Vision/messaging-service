const {fileMetadata: md} = require("../db/api.js");
const gcs = require("./gcs.js");

module.exports = {
  compare(newEntry) {
    const {displayId, filePath, version: checkVersion} = newEntry;

    return md.getFileVersion(filePath)
    .then(version=>version ||
      gcs.version(filePath).then(md.setFileVersion.bind(null, filePath)))
    .then((version)=>({
      matched: version === checkVersion, version, filePath, displayId
    }));
  }
};
