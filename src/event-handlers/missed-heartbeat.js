const displayConnections = require("./display-connections");

const errorContext = "Missed heartbeat (expired connection key):";
const errorMessage = `${errorContext} Invalid display id`;

module.exports = {
  doOnAllPods(data) {
    const displayId = data.split(":").pop();
    if (!displayId) {return console.error(errorMessage, data);}

    if (!displayConnections.hasSparkFor(displayId)) {return;}
    displayConnections.removeById(displayId);
  }
};
