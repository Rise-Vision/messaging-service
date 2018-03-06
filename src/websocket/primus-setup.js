const logger = require("../logger");
const querystring = require("querystring");
const url = require("url");
const displayConnections = require("../event-handlers/display-connections");
const handlers = require("../event-handlers/messages");

module.exports = {
  init(primus) {
    primus.authorize((req, done)=>{
      const {displayId, machineId} = querystring.parse(url.parse(req.url).query);
      const invalidIds = ["undefined", "null"];

      if (!displayId || !machineId || [displayId, machineId].some(id=>invalidIds.includes(id))) {
        logger.log(`Missing connection parameters (displayId: ${displayId}, machineId: ${machineId})`);
        return done({
          statusCode: 400,
          message: "displayId/machineId required"
        });
      }

      done();
    });

    primus.on("connection", (spark) => {
      logger.log(`Spark connection from ${JSON.stringify(spark.address)}`);

      displayConnections.put(spark);

      spark.on("end", ()=>{
        displayConnections.remove(spark);
      });

      if (spark.query.displayId === "apps") {
        spark.write({"msg": "client-connected", "clientId": spark.id});
      }

      spark.on("data", (data)=>{
        const displayIdError =
        "DisplayId should not be included in messages. It is included as a connection parameter.";

        if (!data) {return;}
        if (data.displayId) {
          logger.log(displayIdError);
          return spark.write({error: 400, msg: displayIdError});
        }

        const fullData = {...data, ...spark.query};
        const dataHandler = handlers.getHandler(fullData);

        return dataHandler && dataHandler.doOnIncomingPod(fullData);
      });
    });
  }
};
