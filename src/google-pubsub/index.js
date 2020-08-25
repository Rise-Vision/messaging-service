const {PubSub} = require('@google-cloud/pubsub');
const logger = require("../logger");
const {
  PROJECT_ID: projectId = "default-project-id",
  CONNECTION_STATUS_PUBSUB_TOPIC: defaultTopic = "default-topic",
  PUBSUB_PUBLISH_CREDENTIAL_PATH: keyFilename = "pubsub-publish-credential.json"
} = process.env;

const pubSubClient = new PubSub({projectId, keyFilename});

const messageObject = (id, status)=>({
  id,
  status,
  timestamp: Date.now()
});

module.exports = {
  publishDisconnection(displayId) {
    module.exports.publish(messageObject(displayId, "disconnected"));
  },
  publishConnection(displayId) {
    module.exports.publish(messageObject(displayId, "connected"));
  },
  publish(msg = {}, topic = defaultTopic) {
    const dataBuffer = Buffer.from(JSON.stringify(msg));

    pubSubClient.topic(topic).publish(dataBuffer)
    .then(msgId=>{
      logger.debug(`Message ${msgId} published.`);
    })
    .catch(console.error);
  },
  getClient() {return pubSubClient;}
};
