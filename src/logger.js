let debugMode = process.env.NODE_ENV === "test";

module.exports = {
  debugToggle() {
    debugMode = !debugMode;
    console.log(`Debug mode is ${debugMode ? "on" : "off"}`);
  },
  log(str) {
    debugMode && console.log(str); // eslint-disable-line
  }
};
