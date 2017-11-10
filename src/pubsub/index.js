const podname = process.env.podname;
const pubsubUpdate = require("./pubsub-update");
const channel = "pubsub-update";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const pub = redis.createClient({host: redisHost});
const sub = redis.createClient({host: redisHost});

sub.subscribe(channel);
sub.on("message", (ch, msg)=>{
  if (ch !== channel) {return;}
  if (msg.includes(podname)) {return;}

  pubsubUpdate.processUpdate(msg);
});

module.exports = function postHandler(req, resp) {
  const updateMessage = JSON.stringify(Object.assign({}, req.body, {podname}));

  pubsubUpdate.processUpdate(updateMessage);
  pub.publish(channel, updateMessage);
  resp.send(updateMessage);
}
