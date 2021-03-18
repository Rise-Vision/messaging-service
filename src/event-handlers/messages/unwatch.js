const db = require("../../db/api");
const displayConnections = require("../display-connections");
const logger = require("../../logger");

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "UNWATCH" &&
      data.filePaths;
  },
  doOnIncomingPod(data, resp) {
    const {displayId, filePaths} = data;

    logger.log(`Unwatch ${displayId} ${filePaths.join(',')}`);

    return db.watchList.unwatch(displayId, filePaths)
      .then(() => {
        const message = {
          topic: "unwatch-result"
        };

        return resp ? resp.send(message) : displayConnections.sendMessage(displayId, message);
      })
    .catch(error => console.error(displayId, error));
  }
};
