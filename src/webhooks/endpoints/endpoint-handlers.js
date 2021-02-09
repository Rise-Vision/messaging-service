const paramErrors = require("./param-errors");

const dbApi = require("../../db/api");
const logger = require("../../logger");

const authorizationUser = process.env.NODE_ENV === "test" ?
  "TEST" : process.env.WEBHOOK_AUTHORIZATION_KEY || String(Math.random());
const expectedAuthorizationKey = `${authorizationUser}:`;

const SERVER_ERROR = 500;

function isAuthorized(req) {
  const header = req.header('Authorization');
  if (!header) {
    return false;
  }

  const fragments = header.split(' ');
  if (fragments.length !== 2) { // eslint-disable-line no-magic-numbers
    return false;
  }

  const authorizationKey = Buffer.from(fragments[1], 'base64').toString();

  return authorizationKey === expectedAuthorizationKey;
}

function invalidInput(req, resp) {
  const invalid = paramError => {
    resp.status(paramError.code).send(paramError.msg);
    return true;
  }

  if (!isAuthorized(req)) {
    return invalid(paramErrors.wrongAuthorization);
  }
  if (!req.query.id) {
    return invalid(paramErrors.missingId);
  }

  return false;
}

function handleError(resp, error) {
  return resp.status(SERVER_ERROR).send(error.message || 'server error');
}

function handleBan(req, resp) {
  const {reason, id} = req.query;

  logger.log(`Received ${id} ban request`);

  if (invalidInput(req, resp)) {
    return;
  }

  dbApi.validation.banEndpointId(id, reason || '')
  .then(() => resp.send("Ban applied"))
  .catch(error => handleError(resp, error));
}

function handleUnban(req, resp) {
  const {id} = req.query;

  logger.log(`Received ${id} unban request`);

  if (invalidInput(req, resp)) {
    return;
  }

  dbApi.validation.unbanEndpointId(id)
  .then(() => resp.send("Unban applied"))
  .catch(error => handleError(resp, error));
}

module.exports = {handleBan, handleUnban}
