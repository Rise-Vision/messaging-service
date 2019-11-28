const logger = require("../../logger");
const fileUpdateHandler = require("../../event-handlers/messages/gcs-file-update");

module.exports = (req, resp) => {
  logger.log(`Received from PSC: ${JSON.stringify(req.body)}`); // eslint-disable-line

  if (!["ADD", "UPDATE", "DELETE"].includes(req.body.type)) {
    console.error("Invalid notification type received: ", req.body);
    return resp.send("");
  }

  fileUpdateHandler.doOnIncomingPod(req.body);
  resp.send("");
}
