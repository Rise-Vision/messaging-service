const logger = require("../logger.js");
const db = require("../db/api.js");
const SERVER_ERROR = 500;

module.exports = function postHandler(req, resp) {
  logger.log(`Received presence request: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

  return db.connections.getPresence(req.body)
  .then(state=>resp.send(state))
  .catch(err=>{
    console.error(err);
    if (!err.message) {err.message = "unknown error";}
    resp.status(SERVER_ERROR).send({error: err.message});
  });
}
