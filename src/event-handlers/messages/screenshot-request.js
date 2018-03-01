const redisPubsub = require("../../redis-pubsub");
const displayConnections = require("../display-connections");

module.exports = {
  canHandle(data) {
    return data.msg === "screenshot";
  },
  doOnIncomingPod(data) {
    module.exports.doOnAllPods(data);
    redisPubsub.publishToPods(data);
  },
  doOnAllPods({did: displayId, cid: clientId, url} = {}) {
    displayConnections.sendMessage(displayId, {
      msg: "screenshot-request",
      displayId,
      url,
      clientId
    });
  }
};
