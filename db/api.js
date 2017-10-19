const redis = require("./redis/datastore.js");

module.exports = {
  fileMetadata: {
    addDisplayTo(filePath, displayId) {
      return true;
    }
  },
  watchList: {
    put(entry) {
      return true;
    }
  }
};
