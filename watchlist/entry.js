const validBucketCharacters = /([a-z]|[0-9]|-|_|\.)*/;

module.exports = {
  validate({displayId, filePath, version} = {}) {
    if (!displayId || !filePath || !version) {return false;}

    if (!filePath.includes("/")) {return false;}

    const bucket = filePath.split("/")[0];
    if (bucket.match(validBucketCharacters)[0] !== bucket) {return false;}

    if (!filePath.split("/")[1]) {return false;}
    return true;
  }
};
