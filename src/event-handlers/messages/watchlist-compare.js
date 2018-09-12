const db = require("../../db/api.js");
const displayConnections = require("../display-connections");

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "WATCHLIST-COMPARE" &&
      data.lastChanged;
  },
  doOnIncomingPod(data) {
    const {displayId, lastChanged} = data;

    return db.watchList.lastChanged(displayId)
    .then(msLastChanged =>
      (lastChanged === msLastChanged ?
        Promise.resolve({}) : db.watchList.get(displayId))
      .then(watchlist => {
        const message = {
          topic: "watchlist-result",
          watchlist: watchlist || {},
          lastChanged: msLastChanged
        };

        return displayConnections.sendMessage(displayId, message);
      }))
    .catch(error => console.error(displayId, error));
  }
};
