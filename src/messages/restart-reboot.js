const pubsub = require("../redis-pubsub");

function forwardRebootMessage(displayId) {
  pubsub.publishToPods({msg: 'reboot-request', displayId});
}

function forwardRestartMessage(displayId) {
  pubsub.publishToPods({msg: 'restart-request', displayId});
}

module.exports = {forwardRebootMessage, forwardRestartMessage};
