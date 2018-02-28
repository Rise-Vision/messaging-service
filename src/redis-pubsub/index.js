const podname = process.env.podname;
const displayConnections = require("../messages/display-connections");
const fileStatusUpdate = require("../file-status-update");
const logger = require("../logger");
const channel = "pubsub-update";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const pub = redis.createClient({host: redisHost});
const sub = redis.createClient({host: redisHost});
const messageTypesFromCore =
  ["content-update", "restart-request", "reboot-request", "screenshot-request"];

sub.subscribe(channel);
sub.on("message", (ch, msg)=>{
  logger.log(`Received from REDIS PUBSUB: ${msg}`);

  if (ch !== channel) {return;}
  if (msg.includes(podname)) {return;}

  const data = JSON.parse(msg);

  if (messageTypesFromCore.includes(data.msg)) {
    displayConnections.sendMessage(data.displayId, data);
  }
  else {
    fileStatusUpdate.processUpdate(msg);
  }
});

module.exports = {
  publishToPods(message) {
    const messageAsString = JSON.stringify(Object.assign({}, message, {podname}));
    logger.log(`Publishing message to pods: ${messageAsString}`);

    module.exports.publish(messageAsString);
  },
  publish(message) {
    pub.publish(channel, message);
  }
}
