const sparks = new Map();
const db = require("../db/api.js");
const logger = require("../logger.js");
const googlePubSub = require("../google-pubsub");

module.exports = {
  put(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    sparks.set(displayId, spark);
    db.connections.setConnected(displayId).catch(console.error);
    googlePubSub.publishConnection(displayId);

    logger.debug(`Added spark for ${displayId} ${spark.id}`);
  },
  remove(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    if (sparks.get(displayId) !== spark) {return;}

    sparks.delete(displayId);
    db.connections.setDisconnected(displayId).catch(console.error);
    googlePubSub.publishDisconnection(displayId);

    logger.debug(`Removed spark for ${displayId} ${spark.id}`);
  },
  recordHeartbeat(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    db.connections.recordHeartbeat(displayId).catch(console.error);
  },
  sendMessage(displayId, msg) {
    logger.log(`Sending ${JSON.stringify(msg)} to ${displayId}`);

    const spark = sparks.get(displayId);
    if (!spark) {
      logger.log(`No spark for ${displayId}`);
      return;
    }

    spark.write(msg);
  },
  hasSparkFor(displayId) {
    return sparks.has(displayId);
  }
};
