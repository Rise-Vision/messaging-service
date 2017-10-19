module.exports = {
  validate({displayId, filePath, version} = {}) {
    return displayId && filePath && version;
  }
};
