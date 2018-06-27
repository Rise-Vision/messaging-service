const {fileMetadata: md} = require("../db/api.js");
const gcs = require("../gcs.js");

function fetchVersionFromGCS(filePath) {
  return gcs.version(filePath)
  .then(version => md.setFileVersion(filePath, version))
  .catch(err => {
    if (err.message === "NOEXIST") {
      return md.setFileVersion(filePath, "0").then(() => {
        return Promise.reject(err);
      })
    }
    return Promise.reject(err);
  });
}

module.exports = {
  compare(newEntry) {
    const {displayId, filePath, version: checkVersion} = newEntry;

    return md.getFileVersion(filePath)
    .then(version=> {
      if (!version) {
        return fetchVersionFromGCS(filePath);
      }

      if (version === "0") {
        return Promise.reject(Error("NOEXIST"));
      }

      return version;
    })
    .then((version)=>({
      matched: version === checkVersion || version === "0", version, filePath, displayId
    }));
  }
};
