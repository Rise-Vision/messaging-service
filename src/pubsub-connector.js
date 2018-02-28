const podname = process.env.podname;
const logger = require("./logger");
const redisPubsub = require("./redis-pubsub");
const fileStatusUpdate = require("./file-status-update");

module.exports = function postHandler(req, resp) {
  logger.log(`Received from PSC: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  const updateMessage = JSON.stringify(Object.assign({}, req.body, {podname}));

  fileStatusUpdate.processUpdate(updateMessage);
  redisPubsub.publish(updateMessage);
  resp.send(updateMessage);
}
