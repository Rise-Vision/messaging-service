const setCorsHeaders = require("./set-cors-headers");

module.exports = (req, resp) => {
  setCorsHeaders(req, resp);
  resp.send("");
}
