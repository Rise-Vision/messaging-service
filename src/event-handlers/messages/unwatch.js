const db = require("../../db/api");
const displayConnections = require("../display-connections");

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "UNWATCH" &&
      data.filePaths;
  },
  doOnIncomingPod(data) {
    const {displayId, filePaths} = data;

    return db.watchList.unwatch(displayId, filePaths)
      .then(() => {
        const message = {
          topic: "unwatch-result"
        };

        return displayConnections.sendMessage(displayId, message);
      })
    .catch(error => console.error(displayId, error));
  }
};
