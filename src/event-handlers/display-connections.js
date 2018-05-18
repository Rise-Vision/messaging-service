const sparks = new Map();
const db = require("../db/api.js");
const logger = require("../logger.js");

module.exports = {
  put(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    sparks.set(displayId, spark);
    db.connections.setConnected(displayId).catch(console.error);

    logger.log(`Added spark for ${displayId} ${spark.id}`);
  },
  remove(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    if (sparks.get(displayId) !== spark) {return;}

    sparks.delete(displayId);
    db.connections.setLastConnected(displayId).catch(console.error);

    logger.log(`Removed spark for ${displayId} ${spark.id}`);
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
