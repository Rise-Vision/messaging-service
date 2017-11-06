const Storage = require("@google-cloud/storage");
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

    return storage.bucket(filePath.split("/")[0])
    .file(filePath.split("/").slice(1).join("/"))
    .getMetadata({fields: "generation"})
    .then(result=>result[0].generation);
  }
};
