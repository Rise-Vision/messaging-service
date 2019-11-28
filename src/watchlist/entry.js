const gcsValidator = require("gcs-filepath-validator");
const logger = require("../logger.js");

module.exports = {
  validate({displayId, filePath, version} = {}) {
    logger.debug(`Validating ${displayId}, ${filePath}, ${version}`);
    if (!displayId || !filePath) {return false;}
    if (!version && !filePathIsFolder(filePath)) {return false;}

    logger.debug(`Validating GCS filepath`);
    return gcsValidator.validateFilepath(filePath);
  },
  filePathIsFolder
};

function filePathIsFolder(filePath) {
  return filePath.endsWith("/");
}
