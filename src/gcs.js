const NOT_FOUND = 404;
const Storage = require("@google-cloud/storage");
const logger = require("./logger.js");
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
    .getMetadata({fields: "generation,metadata"})
    .then(result=> {
      const {generation, metadata} = result[0];
      if (metadata && metadata.trashed === 'true') {
        return Promise.reject(new Error("File is trashed"));
      }
      return generation;
    })
    .catch(err=>{
      if (err && err.code === NOT_FOUND) {
        logger.log(`Setting version "0" for not found object ${bucket}/${object}`);
        return "0";
      }

      return Promise.reject(err);
    });
  },
  getFiles(folder) {
    validate(folder);

    logger.log(`Retrieving GCS file contents for ${folder}`);
    return storage.bucket(folder.split("/")[0])
    .getFiles({
      prefix: folder.split("/").slice(1).join("/"),
      delimiter: "/",
      fields: "items(name,generation)"
    })
    .then(files=>{
      if (files[0].length === 0) {
        return Promise.reject(Error("NOEXIST"))
      }

      const nonFolderFiles = files[0]
      .filter(file=>!file.name.endsWith("/"));

      if (nonFolderFiles.length === 0) {
        return Promise.reject(Error("EMPTYFOLDER"));
      }

      return nonFolderFiles.map(fileObject=>fileObject.metadata);
    });
  }
};

function validate(path) {
  if (!path) {throw Error("invalid params");}
  if (!path.includes("/")) {throw Error("invalid params");}
  if (!path.split("/")[1]) {throw Error("invalid params");}
}
