const sparks = new Map();
const logger = require("../logger.js");

module.exports = {
  put(spark) {
    if (!spark || !spark.query) {return;}
    sparks.set(spark.query.displayId, spark);
    logger.log(`Added spark for ${spark.query.displayId}`);
  },
  remove(spark) {
    if (!spark || !spark.query) {return;}
    sparks.delete(spark.query.displayId);
    logger.log(`Removed spark for ${spark.query.displayId}`);
  },
  sendMessage(displayId, msg) {
    const spark = sparks.get(displayId);
    if (!spark) {return;}

    spark.write(msg);
  }
};
