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
    validate(filePath);

    const bucket = filePath.split("/")[0]
    const object = filePath.split("/").slice(1).join("/");

    logger.log(`Checking version for ${bucket}/${object}`);
    return storage.bucket(bucket)
    .file(object)
    .getMetadata({fields: "generation"})
    .then(result=>result[0].generation);
  },
  getFiles(folder) {
    validate(folder);

    return storage.bucket(folder.split("/")[0])
    .getFiles({
      prefix: folder.split("/").slice(1).join("/"),
      delimiter: "/",
      fields: "kind, items(bucket,name,generation)"
    })
    .then(files=>files[0]
    .filter(file=>!file.name.endsWith("/"))
    .map(fileObject=>fileObject.metadata));
  }
};

function validate(path) {
  if (!path) {throw Error("invalid params");}
  if (!path.includes("/")) {throw Error("invalid params");}
  if (!path.split("/")[1]) {throw Error("invalid params");}
}
