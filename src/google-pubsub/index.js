const {v1} = require('@google-cloud/pubsub');
const logger = require("../logger");
const {
  PROJECT_ID: projectId = "default-project-id",
  CONNECTION_STATUS_PUBSUB_TOPIC: defaultTopic = "default-topic",
  PUBSUB_PUBLISH_CREDENTIAL_PATH: keyFilename = "pubsub-publish-credential.json"
} = process.env;

const pubSubClient = new v1.PublisherClient({projectId, keyFilename});

const topicPath = pubSubClient.projectTopicPath(projectId, defaultTopic);

const messageObject = (id, status)=>({
  id,
  status,
  timestamp: Date.now()
});

const retrySettings = {
  retryCodes: [
    10, // ABORTED
    1,  // 'CANCELLED',
    4,  // 'DEADLINE_EXCEEDED'
    13, // 'INTERNAL'
    8,  // 'RESOURCE_EXHAUSTED'
    14, // 'UNAVAILABLE'
    2   // 'UNKNOWN'
  ],
  backoffSettings: {
    initialRetryDelayMillis: 9000,
    retryDelayMultiplier: 1.3,
    maxRetryDelayMillis: 300000,
    initialRpcTimeoutMillis: 15000,
    rpcTimeoutMultiplier: 1.1,
    maxRpcTimeoutMillis: 630000,
    totalTimeoutMillis: 660000
  }
}; /* eslint no-magic-numbers: "off", no-multi-spaces: "off" */
module.exports = {
  publishDisconnection(displayId) {
    module.exports.publish(messageObject(displayId, "disconnected"));
  },
  publishConnection(displayId) {
    module.exports.publish(messageObject(displayId, "connected"));
  },
  publish(msg = {}, topic = topicPath) {
    const data = Buffer.from(JSON.stringify(msg));
    const messages = [{data}];
    const request = {topic, messages};

    pubSubClient.publish(request, {retry: retrySettings})
    .then(()=>{
      logger.debug(`Message published`, msg);
    })
    .catch(console.error);
  },
  getClient() {return pubSubClient;}
};
