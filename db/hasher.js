const crypto = require("crypto");

module.exports = function hasher(str) {
  const hash = crypto.createHash('sha256');

  hash.update(str);
  return hash.digest("hex");
}
