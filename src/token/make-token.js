const crypto = require("./crypto.js");

module.exports = (inp = {})=>{
  const {displayId, filePath} = inp;
  if (!displayId || !filePath) {throw Error("invalid params");}

  const data = {
    timestamp: Date.now(),
    filePath,
    displayId
  };

  const token = {
    data,
    hash: crypto.encryptAndHash(data)
  };

  return Object.assign({}, inp, {token});
}
