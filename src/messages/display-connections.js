const sparks = new Map();
const logger = require("../logger.js");

module.exports = {
  put(spark) {
    if (!spark || !spark.query) {return;}
    sparks[spark.query.displayId] = spark;
    logger.log(`Added spark for ${spark.query.displayId}`);
  },
  remove(spark) {
    logger.log(`Removed spark for ${spark.query.displayId}`);
    if (!spark || !spark.query) {return;}
    Reflect.deleteProperty(sparks, spark.query.displayId);
  },
  sendMessage(displayId, msg) {
    const spark = sparks[displayId];
    if (!spark) {return;}

    spark.write(msg);
  }
};
