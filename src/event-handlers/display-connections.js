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

    logger.log(`Added spark for ${displayId}`);
  },
  remove(spark) {
    if (!spark || !spark.query) {return;}
    const displayId = spark.query.displayId === "apps" ?
      spark.id :
      spark.query.displayId;

    sparks.delete(displayId);
    db.connections.setDisconnected(displayId).catch(console.error);

    logger.log(`Removed spark for ${displayId}`);
  },
  sendMessage(displayId, msg) {
    const spark = sparks.get(displayId);
    if (!spark) {return;}

    spark.write(msg);
  },
  hasSparkFor(displayId) {
    return sparks.has(displayId);
  }
};
