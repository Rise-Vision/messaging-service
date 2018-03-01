const fs = require("fs");
const thisFileName = require("path").basename(__filename);
const handlerNames = fs.readdirSync(__dirname).filter(fname=>fname !== thisFileName); // eslint-disable-line no-sync

let handlers = null;

module.exports = {
  init() {
    handlers = handlerNames.map(name=>require(`./${name}`));
  },
  getHandler(data) {
    return handlers.find(handler=>handler.canHandle(data));
  }
};

