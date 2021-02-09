const logger = require("../logger");
const querystring = require("querystring");
const url = require("url");
const dbApi = require("../db/api");
const displayConnections = require("../event-handlers/display-connections");
const handlers = require("../event-handlers/messages");

const invalidIds = ["undefined", "null"];

const checkBanned = (type, id, done) => {
  dbApi.validation.isBannedEndpointId(id)
  .then(isBanned => {
    if (isBanned) {
      logger.log(`Banned ${type} id (${type}Id: ${id})`);
      return done({
        statusCode: 403,
        message: "banned"
      });
    }

    done();
  });
}

const authorizeSchedule = (scheduleId, endpointId, done) => {
  if (!scheduleId || !endpointId || [scheduleId, endpointId].some(id=>invalidIds.includes(id))) {
    logger.log(`Missing connection parameters (scheduleId: ${scheduleId}, endpointId: ${endpointId})`);
    return done({
      statusCode: 400,
      message: "scheduleId/endpointId required"
    });
  }

  dbApi.validation.isValidScheduleId(scheduleId)
  .then(isValid => {
    if (!isValid) {
      logger.log(`Invalid schedule id (scheduleId: ${scheduleId})`);
      return done({
        statusCode: 404,
        message: "scheduleId not valid"
      });
    }

    return checkBanned('endpoint', endpointId, done);
  });
}

const authorizeDisplay = (displayId, machineId, done) => {
  if (!displayId || !machineId || [displayId, machineId].some(id=>invalidIds.includes(id))) {
    logger.log(`Missing connection parameters (displayId: ${displayId}, machineId: ${machineId})`);
    return done({
      statusCode: 400,
      message: "displayId/machineId required"
    });
  }

  dbApi.validation.isValidDisplayId(displayId)
  .then(isValid => {
    if (!isValid) {
      logger.log(`Invalid display id (displayId: ${displayId})`);
      return done({
        statusCode: 404,
        message: "displayId not valid"
      });
    }

    return checkBanned('display', displayId, done);
  });
}

module.exports = {
  init(primus) {
    primus.authorize((req, done)=>{
      const {displayId, machineId, scheduleId, endpointId} =
        querystring.parse(url.parse(req.url).query);

      if (scheduleId) {
        authorizeSchedule(scheduleId, endpointId, done);
      } else {
        authorizeDisplay(displayId, machineId, done);
      }
    });

    primus.on("connection", (spark) => {
      logger.debug(`Spark connection from ${JSON.stringify(spark.address)}`);

      if (spark.query && !spark.query.displayId && spark.query.endpointId) {
        spark.query.displayId = spark.query.endpointId;
      }

      displayConnections.put(spark);

      spark.on("end", ()=>{
        displayConnections.remove(spark);
      });

      spark.on("heartbeat", ()=>{
        displayConnections.recordHeartbeat(spark);
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
