module.exports = function(err, filePath, msg) {
  console.error(err);

  return {
    error: err.code,
    topic: "watch-result",
    filePath,
    msg: `There was an error processing WATCH:${msg}`,
    detail: err.message
  };
}
