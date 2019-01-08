const logger = require("../../logger.js");
const displayConnections = require("../../event-handlers/display-connections");
const BAD_REQUEST = 400;
const setCorsHeaders = require("../presence/set-cors-headers");

module.exports = (req, resp) => {
  setCorsHeaders(req, resp);

  if (!req.body || !req.body.displayId || !req.body.machineId) {
    const errMsg = "expected application/json, POST, {machineId, displayId}";
    return resp.status(BAD_REQUEST).send({error: errMsg});
  }

  logger.log(`Received display activation request: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  displayConnections.sendMessage(req.body.machineId, {topic: "display-activation", displayId: req.body.displayId});

  resp.send("Message processed");
};
