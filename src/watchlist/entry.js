const gcsValidator = require("gcs-filepath-validator");

module.exports = {
  validate({displayId, filePath, version} = {}) {
    if (!displayId || !filePath || !version) {return false;}

    return gcsValidator.validateFilepath(filePath);
  }
};
