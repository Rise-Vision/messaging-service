const podname = process.env.podname;
const displayConnections = require("../messages/display-connections");
const pubsubUpdate = require("./pubsub-update");
const logger = require("../logger");
const channel = "pubsub-update";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const pub = redis.createClient({host: redisHost});
const sub = redis.createClient({host: redisHost});
const forwardedMessageTypes = ["restart-request", "reboot-request"];

sub.subscribe(channel);
sub.on("message", (ch, msg)=>{
  logger.log(`Received from REDIS PUBSUB: ${msg}`);

  if (ch !== channel) {return;}
  if (msg.includes(podname)) {return;}

  const data = JSON.parse(msg);

  if (forwardedMessageTypes.includes(data.msg)) {
    displayConnections.sendMessage(data.displayId, data);
  }
  else {
    pubsubUpdate.processUpdate(msg);
  }
});

module.exports = {
  forwardMessage(message) {
    const messageAsString = JSON.stringify(Object.assign({}, message, {podname}));
    logger.log(`Forwarding message to display: ${messageAsString}`);

    displayConnections.sendMessage(message.displayId, message);
    module.exports.publish(messageAsString);
  },
  publish(message) {
    pub.publish(channel, message);
  }
}
