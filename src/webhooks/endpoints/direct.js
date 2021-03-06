const dbApi = require("../../db/api");
const logger = require("../../logger");
const paramErrors = require("./param-errors");
const handlers = require("../../event-handlers/messages");
const setCorsHeaders = require("../set-cors-headers");

const validTopics = ["WATCH", "UNWATCH", "WATCHLIST-COMPARE"];

module.exports = (req, resp) => { // eslint-disable-line max-statements
  setCorsHeaders(req, resp);

  const {topic, endpointId} = req.query;

  logger.log(`Received ${topic} request from Viewer id=${endpointId}`);

  if (invalidInput(req.query, resp)) {return;}

  return checkAuthorization(req.query, resp).then(invalid => {
    if (invalid) {return;}

    if (topic.toUpperCase() === "UNWATCH") {
      req.query.filePaths = req.query.filePaths.split(",");
    }

    req.query.displayId = req.query.endpointId;

    const eventHandler = handlers.getHandler(req.query);
    if (!eventHandler) {return invalidHandler(resp, paramErrors.noHandler);}

    eventHandler.doOnIncomingPod(req.query, resp);
    logger.log(`Request from Viewer id=${endpointId} processed.`);
  })
}

function invalidInput({topic, endpointId, scheduleId, displayId, filePaths} = {}, resp) { // eslint-disable-line max-statements
  const invalid = invalidHandler.bind(null, resp);

  if (!topic) {return invalid(paramErrors.missingTopic);}
  if (!validTopics.includes(topic.toUpperCase())) {return invalid(paramErrors.invalidTopic);}
  if (!endpointId) {return invalid(paramErrors.missingEndpointId);}
  if (!scheduleId) {return invalid(paramErrors.missingScheduleId);}
  if (displayId) {return invalid(paramErrors.displaysNotAllowed);}
  if (topic.toUpperCase() === "UNWATCH" && !filePaths) {
    return invalid(paramErrors.missingFilePaths);
  }

  return false;
}

function invalidHandler(resp, paramError) {
  resp.status(paramError.code).send(paramError.msg);
  return true;
}

function checkAuthorization({endpointId, scheduleId} = {}, resp) {

  const invalid = invalidHandler.bind(null, resp);

  return dbApi.validation.isValidScheduleId(scheduleId)
  .then(isValid => {
    if (!isValid) {
      logger.log(`Invalid schedule id (scheduleId: ${scheduleId})`);
      return invalid(paramErrors.invalidSchedule);
    }

    return dbApi.validation.isBannedEndpointId(endpointId)
    .then(isBanned => {
      if (isBanned) {
        logger.log(`Banned endpoint (id: ${endpointId})`);
        return invalid(paramErrors.bannedEndpoint);
      }

      return false;
    });
  });


}
