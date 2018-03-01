const podname = process.env.podname;
const logger = require("../logger");
const redisPubsub = require("../redis-pubsub");
const fileUpdateHandler = require("./file-update-handler");

module.exports = (req, resp) => {
  logger.log(`Received from PSC: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  const messageWithPodname = Object.assign({}, req.body, {podname});
  const updateMessage = JSON.stringify(messageWithPodname);

  fileUpdateHandler.processUpdate(messageWithPodname);
  redisPubsub.publish(updateMessage);
  resp.send(updateMessage);
}
