const logger = require("../logger.js");
const db = require("../db/api.js");
const SERVER_ERROR = 500;
const BAD_REQUEST = 400;
const defaultOrigin = process.env.NODE_ENV === "test" ?
"*" :
"https://www.risevision.com";

module.exports = {
  postHandler(req, resp) {
    handleCors(req, resp);
    if (!req.body || !Array.isArray(req.body)) {
      const errMsg = "expected application/json, POST, [ids]";
      return resp.status(BAD_REQUEST).send({error: errMsg});
    }

    logger.log(`Received presence request: ${JSON.stringify(req.body, null, 2)}`); // eslint-disable-line

    return db.connections.getPresence(req.body)
    .then(state=>resp.send(state))
    .catch(err=>{
      console.error(err);
      if (!err.message) {err.message = "unknown error";}
      resp.status(SERVER_ERROR).send({error: err.message});
    });
  },
  optionsHandler(req, resp) {
    handleCors(req, resp);
    resp.send("");
  }
};

function handleCors(req, resp) {
  const requestingOrigin = req.get("origin") || "";
  const allowedOrigin = requestingOrigin.endsWith("risevision.com") ?
    requestingOrigin :
    defaultOrigin;

  resp.set({
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "*"
  });
}
