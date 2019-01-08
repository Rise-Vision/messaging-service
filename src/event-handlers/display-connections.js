const sparks = new Map();
const db = require("../db/api.js");
const logger = require("../logger.js");

function absentDisplayId(spark) {
  return !spark.query.displayId || ["null", "undefined"].some(it => it === spark.query.displayId);
}

function resolveSparkId(spark) {
  if (absentDisplayId(spark) && spark.query.machineId) {
    return spark.query.machineId;
  }

  return spark.query.displayId === "apps" ?
    spark.id :
    spark.query.displayId;
}

module.exports = {
  put(spark) {
    if (!spark || !spark.query) {return;}

    const sparkId = resolveSparkId(spark);
    sparks.set(sparkId, spark);

    if (!absentDisplayId(spark)) {
      db.connections.setConnected(sparkId).catch(console.error);
    }

    logger.log(`Added spark for ${sparkId} ${spark.id}`);
  },
  remove(spark) {
    if (!spark || !spark.query) {return;}
    const sparkId = resolveSparkId(spark);

    if (sparks.get(sparkId) !== spark) {return;}

    sparks.delete(sparkId);
    if (!absentDisplayId(spark)) {
      db.connections.setLastConnected(sparkId).catch(console.error);
    }

    logger.log(`Removed spark for ${sparkId} ${spark.id}`);
  },
  recordHeartbeat(spark) {
    if (!spark || !spark.query) {return;}
    const sparkId = resolveSparkId(spark);
    if (!absentDisplayId(spark)) {
      db.connections.recordHeartbeat(sparkId).catch(console.error);
    }
  },
  sendMessage(sparkId, msg) {
    logger.log(`Sending ${JSON.stringify(msg)} to ${sparkId}`);

    const spark = sparks.get(sparkId);
    if (!spark) {
      logger.log(`No spark for ${sparkId}`);
      return;
    }

    spark.write(msg);
  },
  hasSparkFor(sparkId) {
    return sparks.has(sparkId);
  }
};
