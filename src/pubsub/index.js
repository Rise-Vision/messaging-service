const podname = process.env.podname;
const pubsubUpdate = require("./pubsub-update");
const logger = require("../logger.js");
const channel = "pubsub-update";
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;
const pub = redis.createClient({host: redisHost});
const sub = redis.createClient({host: redisHost});

// In an stable implementation, this should be created in its own module
const IPFS = require('ipfs')
const node = new IPFS()
node.on('ready', () => console.log("IPFS connection is ready"))

sub.subscribe(channel);
sub.on("message", (ch, msg)=>{
  logger.log(`Received from REDIS PUBSUB: ${msg}`);

  if (ch !== channel) {return;}
  if (msg.includes(podname)) {return;}

  pubsubUpdate.processUpdate(msg);
});

function addToIPFS(req) {
    const path = req.body.filePath
    // later load from GCS
    const content = "sample hello world content"
    console.log(`Adding: ${path}: ${content}`)

    const file = {
      path, content: Buffer.from(content)
    }

    return node.files.add(file)
    .then(filesAdded =>
    {
      const hash = filesAdded[0].hash
      console.log('Added file:', filesAdded[0].path, hash)

      return hash
    })
}

module.exports = function postHandler(req, resp) {
  logger.log(`Received from PSC: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  addToIPFS(req)
  .then(hash =>
  {
    const updateMessage = JSON.stringify(Object.assign({}, req.body, {podname}));

    pubsubUpdate.processUpdate(updateMessage, hash);
    pub.publish(channel, updateMessage);
    resp.send(updateMessage);
  })
}
