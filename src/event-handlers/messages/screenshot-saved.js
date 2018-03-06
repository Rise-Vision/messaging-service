const redisPubsub = require("../../redis-pubsub");
const displayConnections = require("../display-connections");

module.exports = {
  canHandle(data) {
    return data.msg === "screenshot-saved";
  },
  doOnIncomingPod(data) {
    module.exports.doOnAllPods(data);
    redisPubsub.publishToPods(data);
  },
  doOnAllPods({did: displayId, cid: clientId, url} = {}) {
    displayConnections.sendMessage(clientId, {
      msg: "screenshot-saved",
      displayId,
      url
    });
  }
};
