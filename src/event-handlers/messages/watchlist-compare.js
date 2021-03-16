const db = require("../../db/api.js");
const displayConnections = require("../display-connections");
const logObjectLimit = 300;

module.exports = {
  canHandle(data) {
    return data &&
      data.topic && data.topic.toUpperCase() === "WATCHLIST-COMPARE" &&
      data.lastChanged;
  },
  doOnIncomingPod(data, resp) {
    const {displayId, lastChanged} = data;

    return db.watchList.lastChanged(displayId)
    .then(msLastChanged => {
      return db.watchList.get(displayId)
      .then(watchlist => {
        console.log(`Returning watchlist for ${displayId} with last changed ${lastChanged} and msLastChanged ${msLastChanged}: ${JSON.stringify(watchlist).substring(0, logObjectLimit)}`);

        const message = {
          topic: "watchlist-result",
          watchlist: watchlist || {},
          lastChanged: msLastChanged
        };

        return resp ? resp.send(message) : displayConnections.sendMessage(displayId, message);
      })
    })
    .catch(error => console.error(displayId, error));
  }
};
