const podname = process.env.podname;
const logger = require("../logger");
const channel = "pubsub-update";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;

let pub = null;
let sub = null;

function init(handlers) {
  pub = redis.createClient({host: redisHost});
  sub = redis.createClient({host: redisHost});

  sub.subscribe(channel);
  sub.on("message", (ch, msg)=>{
    logger.log(`Received from REDIS PUBSUB: ${msg}`);

    if (ch !== channel) {return;}
    if (msg.includes(podname)) {return;}

    const data = JSON.parse(msg);

    const handler = handlers.find(current => current.canHandleMessage(data));

    return handler && handler.handleMessage(data);
  });
}

module.exports = {
  init,
  publishToPods(message) {
    const messageAsString = JSON.stringify(Object.assign({}, message, {podname}));
    logger.log(`Publishing message to pods: ${messageAsString}`);

    module.exports.publish(messageAsString);
  },
  publish(message) {
    pub.publish(channel, message);
  }
}