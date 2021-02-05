const paramErrors = require("./param-errors");

const dbApi = require("../../db/api");
const logger = require("../../logger");

// const serverKey = process.env.NODE_ENV === "test" ?
//  "TEST" : process.env.CORE_SENDER_KEY || String(Math.random());
const serverKey = 'TEST'
const SERVER_ERROR = 500;

function invalidInput({sk, kind, action, id} = {}, resp) { // eslint-disable-line max-statements
  const invalid = invalidHandler.bind(null, resp);

  if (sk !== serverKey) {return invalid(paramErrors.wrongServerKey);}
  if (!kind) {return invalid(paramErrors.missingKind);}
  if (!action) {return invalid(paramErrors.missingAction);}
  if (!id) {return invalid(paramErrors.invalidId);}

  if (kind !== 'Display' && kind !== 'Schedule') {
    return invalid(paramErrors.invalidKind);
  }
  if (action !== 'Added' && action !== 'Removed') {
    return invalid(paramErrors.invalidAction);
  }

  return false;
}

function invalidHandler(resp, paramError) {
  resp.status(paramError.code).send(paramError.msg);
  return true;
}

function handleNotification({kind, action, id} = {}) {
  switch (kind) {
    case 'Display':
      return action === 'Added' ?
        dbApi.validations.addDisplayId(id) :
        dbApi.validations.removeDisplayId(id);
    default:
    case 'Schedule':
      return action === 'Added' ?
        dbApi.validations.addScheduleId(id) :
        dbApi.validations.removeScheduleId(id);
  }
}

module.exports = (req, resp) => {
  const {kind, action, id} = req.query;

  logger.log(`Received ${action} ${kind} notification from core for ${id}`);

  if (invalidInput(req.query, resp)) {
    return;
  }

  handleNotification(req.query)
  .then(() => resp.send("Notification processed"))
  .catch(error => resp.status(SERVER_ERROR).send(error.message || 'server error'));
}
