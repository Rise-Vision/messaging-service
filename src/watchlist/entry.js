const gcsValidator = require("gcs-filepath-validator");

module.exports = {
  validate({displayId, filePath, version} = {}) {
    console.log(`Validating entry ${displayId} ${filePath} ${version}`);
    if (!displayId || !filePath || !version) {return false;}

    console.log(`Validating filepath ${filePath}`);
    return gcsValidator.validateFilepath(filePath);
  }
};
