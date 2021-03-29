const podname = process.env.podname;
const logger = require("../logger");
const podsChannel = "inter-pod-publish";
const expiredKeyChannelPattern = "__keyevent*expired";
const redis = require("redis");
const gkeHostname = "display-ms-redis-primary";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const handlers = require("../event-handlers/messages");
const missedHeartbeat = require("../event-handlers/missed-heartbeat");

let pub = null;
let sub = null;

function init() {
  pub = redis.createClient({host: redisHost});
  sub = redis.createClient({host: redisHost});

  pub.on("error", console.error);
  sub.on("error", console.error);

  pub.config("set", "notify-keyspace-events", "Ex");

  sub.subscribe(podsChannel);
  sub.on("message", (ch, msg)=>{
    logger.log(`Received from REDIS PUBSUB: ${msg}`);

    if (msg.includes(podname)) {return;}

    const data = JSON.parse(msg);

    const handler = handlers.getHandler(data);

    if (!handler) {
      return console.error("No handler", data);
    }

    return handler.doOnAllPods(data);
  });

  sub.psubscribe(expiredKeyChannelPattern);
  sub.on("pmessage", (pat, ch, msg)=>{
    logger.log(`Received from REDIS PUBSUB (key event): ${msg}`);

    if (!msg.startsWith("connections:id:")) {return;}

    return missedHeartbeat.doOnAllPods(msg);
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
    logger.log(`Redis publishing to ${podsChannel}: `, pubData);
    pub.publish(podsChannel, JSON.stringify(pubData));
  }
}
