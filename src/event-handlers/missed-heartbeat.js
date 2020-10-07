const googlePubSub = require("../google-pubsub");
const db = require("../db/api.js");
const displayConnections = require("./display-connections");

const errorContext = "Missed heartbeat (expired connection key):";
const errorMessage = `${errorContext} Invalid display id`;

module.exports = {
  doOnAllPods(data) {
    const displayId = data.split(":").pop();
    if (!displayId) {return console.error(errorMessage, data);}

    if (!displayConnections.hasSparkFor(displayId)) {return;}
    googlePubSub.publishDisconnection(displayId);
    db.connections.setDisconnected(displayId).catch(console.error);
  }
};
