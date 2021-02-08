const paramErrors = require("./param-errors");

const dbApi = require("../../db/api");
const logger = require("../../logger");

const serviceKey = 'TEST';
const SERVER_ERROR = 500;

function invalidInput({id, sk} = {}, resp) {
  const invalid = invalidHandler.bind(null, resp);

  if (sk !== serviceKey) {return invalid(paramErrors.wrongServiceKey);}
  if (!id) {return invalid(paramErrors.missingId);}

  return false;
}

function invalidHandler(resp, paramError) {
  resp.status(paramError.code).send(paramError.msg);
  return true;
}

function handleError(resp, error) {
  return resp.status(SERVER_ERROR).send(error.message || 'server error');
}

function handleBan(req, resp) {
  const {reason, id} = req.query;

  logger.log(`Received ${id} ban request`);

  if (invalidInput(req.query, resp)) {
    return;
  }

  dbApi.validation.banEndpointId(id, reason || '')
  .then(() => resp.send("Ban applied"))
  .catch(error => handleError(resp, error));
}

function handleUnban(req, resp) {
  const {id} = req.query;

  logger.log(`Received ${id} unban request`);

  if (invalidInput(req.query, resp)) {
    return;
  }

  dbApi.validation.unbanEndpointId(id)
  .then(() => resp.send("Unban applied"))
  .catch(error => handleError(resp, error));
}

module.exports = {handleBan, handleUnban}
