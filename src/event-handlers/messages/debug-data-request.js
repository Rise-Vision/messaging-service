const redisPubsub = require("../../redis-pubsub");
const displayConnections = require("../display-connections");

module.exports = {
  canHandle(data) {
    return data.msg === "debug-data-request";
  },
  doOnIncomingPod(data) {
    module.exports.doOnAllPods(data);
    redisPubsub.publishToPods(data);
  },
  doOnAllPods(data) {
    displayConnections.sendMessage(data.displayId || data.did, {
      msg: "debug-data-request"
    });
  }
};
