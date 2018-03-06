const logger = require("../../logger");
const serverKey = process.env.NODE_ENV === "test" ?
  "TEST" :
  process.env.CORE_SENDER_KEY || String(Math.random());
const paramErrors = require("./param-errors");
const handlers = require("../../event-handlers/messages");

module.exports = (req, resp) => {
  const {did, msg} = req.query;

  logger.log(`Received ${msg} message from core for ${did}`);

  if (invalidInput(req.query, resp)) {return;}

  const eventHandler = handlers.getHandler(req.query);
  if (!eventHandler) {return invalidHandler(resp, paramErrors.noHandler);}

  eventHandler.doOnIncomingPod(req.query);
  resp.send("Message processed");
}

function invalidInput({sk, did, msg, cid, url} = {}, resp) { // eslint-disable-line max-statements
  const invalid = invalidHandler.bind(null, resp);

  if (!msg) {return invalid(paramErrors.missingMsg);}
  if (!did) {return invalid(paramErrors.missingDisplayId);}
  if (sk !== serverKey) {return invalid(paramErrors.wrongServerKey);}
  if (msg === "screenshot" && !cid) {return invalid(paramErrors.missingCid);}
  if (msg === "screenshot" && !url) {return invalid(paramErrors.missingUrl);}

  return false;
}

function invalidHandler(resp, paramError) {
  resp.status(paramError.code).send(paramError.msg);
  return true;
}
