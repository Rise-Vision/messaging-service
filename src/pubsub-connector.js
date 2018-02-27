const podname = process.env.podname;
const logger = require("./logger");
const pubsub = require("./redis-pubsub");
const pubsubUpdate = require("./redis-pubsub/pubsub-update");

module.exports = function postHandler(req, resp) {
  logger.log(`Received from PSC: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  const updateMessage = JSON.stringify(Object.assign({}, req.body, {podname}));

  pubsubUpdate.processUpdate(updateMessage);
  pubsub.publish(updateMessage);
  resp.send(updateMessage);
}
