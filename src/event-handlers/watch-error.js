const displayConnections = require("./display-connections");

module.exports = function(err = {}, filePath, displayId) {
  console.error(`[${err.message}] [${filePath}] [${displayId}]`);

  displayConnections.sendMessage(displayId, {
    error: err.message,
    errorMsg: err.message,
    errorCode: err.code,
    topic: "watch-result",
    filePath,
    msg: `There was an error processing WATCH:${err.message}`
  });
}
