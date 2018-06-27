const {fileMetadata: md} = require("../db/api.js");
const gcs = require("../gcs.js");

module.exports = {
  compare(newEntry) {
    const {displayId, filePath, version: checkVersion} = newEntry;

    return md.getFileVersion(filePath)
    .then(version=>version ||
      gcs.version(filePath).then(md.setFileVersion.bind(null, filePath)))
    .then((version)=>({
      matched: version === checkVersion || version === "0", version, filePath, displayId
    }))
    .catch(err => {
      if (err.message === "NOEXIST") {
        return md.setFileVersion(filePath, "0").then(() => {
          return Promise.reject(err);
        })
      }
      return Promise.reject(err);
    });
  }
};
