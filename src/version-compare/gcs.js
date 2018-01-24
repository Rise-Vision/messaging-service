const Storage = require("@google-cloud/storage");
const logger = require("../logger.js");
let storage = null;

module.exports = {
  init() {
    storage = Storage({
      projectId: "avid-life-623"
    });
  },
  version(filePath) {
    if (!filePath) {throw Error("invalid params");}
    if (!filePath.includes("/")) {throw Error("invalid params");}
    if (!filePath.split("/")[1]) {throw Error("invalid params");}

    const bucket = filePath.split("/")[0]
    const object = filePath.split("/").slice(1).join("/");

    logger.log(`Checking version for ${bucket}/${object}`);
    return storage.bucket(bucket)
    .file(object)
    .getMetadata({fields: "generation"})
    .then(result=>result[0].generation);
  }
};
