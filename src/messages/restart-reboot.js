const pubsub = require("../redis-pubsub");

const displayConnections = require("./display-connections");

function forwardRebootMessage(displayId) {
  forwardMessage('reboot-request', displayId);
}

function forwardRestartMessage(displayId) {
  forwardMessage('restart-request', displayId);
}

function forwardMessage(messageType, displayId) {
  const message = {msg: messageType, displayId};

  displayConnections.sendMessage(message.displayId, message);

  pubsub.publishToPods(message);
}

module.exports = {forwardRebootMessage, forwardRestartMessage};
