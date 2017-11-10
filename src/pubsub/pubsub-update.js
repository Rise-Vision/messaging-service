const assert = require("assert");

module.exports = {
  processUpdate(msg) {
    const data = JSON.parse(msg);
    assert(data.filePath);
  }
}
