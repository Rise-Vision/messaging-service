const podname = process.env.podname;
const logger = require("../logger");
const channel = "inter-pod-publish";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const handlers = require("../event-handlers/messages");

let pub = null;
let sub = null;

function init() {
  pub = redis.createClient({host: redisHost});
  sub = redis.createClient({host: redisHost});

  pub.on("error", console.error);
  sub.on("error", console.error);

  sub.subscribe(channel);
  sub.on("message", (ch, msg)=>{
    logger.log(`Received from REDIS PUBSUB: ${msg}`);

    if (ch !== channel) {return;}
    if (msg.includes(podname)) {return;}

    const data = JSON.parse(msg);

    const handler = handlers.getHandler(data);

    if (!handler) {
      return console.error("No handler", data);
    }

    return handler.doOnAllPods(data);
  });
}

function quit(cb) {
  pub.quit(()=>{
    sub.quit(cb);
  });
}

module.exports = {
  init,
  quit,
  publishToPods(data) {
    const pubData = {...data, podname};
    logger.log(`Redis publishing to ${channel}: `, pubData);
    pub.publish(channel, JSON.stringify(pubData));
  }
}
