const pubsub = require("../redis-pubsub");

function forwardRebootMessage(displayId) {
  pubsub.forwardMessage({msg: 'reboot-request', displayId});
}

function forwardRestartMessage(displayId) {
  pubsub.forwardMessage({msg: 'restart-request', displayId});
}

module.exports = {forwardRebootMessage, forwardRestartMessage};
