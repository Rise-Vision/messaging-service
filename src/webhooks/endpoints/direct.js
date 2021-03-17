const logger = require("../../logger");
const paramErrors = require("./param-errors");
const handlers = require("../../event-handlers/messages");

module.exports = (req, resp) => {
  const {topic, displayId} = req.query;

  logger.log(`Received ${topic} request from Viewer id=${displayId}`);

  if (invalidInput(req.query, resp)) {return;}

  const eventHandler = handlers.getHandler(req.query);
  if (!eventHandler) {return invalidHandler(resp, paramErrors.noHandler);}

  return eventHandler.doOnIncomingPod(req.query, resp)
  .then(()=>logger.log(`Request from Viewer id=${displayId} processed.`));
}

function invalidInput({topic, displayId} = {}, resp) { // eslint-disable-line max-statements
  const invalid = invalidHandler.bind(null, resp);

  if (!topic) {return invalid(paramErrors.missingTopic);}
  if (!displayId) {return invalid(paramErrors.missingDisplayId);}

  return false;
}

function invalidHandler(resp, paramError) {
  resp.status(paramError.code).send(paramError.msg);
  return true;
}
