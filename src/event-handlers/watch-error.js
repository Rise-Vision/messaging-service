const displayConnections = require("./display-connections");

const SERVER_ERROR = 500;
const OK = 200;

module.exports = function(err = {}, filePath, displayId, resp) { // eslint-disable-line max-params
  console.error(`[${err.message}] [${filePath}] [${displayId}]`);

  const message = {
    error: err.message,
    errorMsg: err.message,
    errorCode: err.code,
    topic: "watch-result",
    filePath,
    msg: `There was an error processing WATCH:${err.message}`
  };

  const httpStatus = ["NOEXIST", "EMPTYFOLDER"].includes(err.message) ? OK : SERVER_ERROR;

  return resp ? resp.status(httpStatus).send(message) : displayConnections.sendMessage(displayId, message);
}

