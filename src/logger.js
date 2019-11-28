let debugMode = process.env.NODE_ENV === "test";

module.exports = {
  debugToggle() {
    debugMode = !debugMode;
    console.log(`Debug mode is ${debugMode ? "on" : "off"}`);
  },
  debug(str, data) {
    if (!debugMode) {return;}
    console.log(data ? `${str}${JSON.stringify(data, 2, null)}` : str); // eslint-disable-line
  },
  log(str, data) {
    console.log(data ? `${str}${JSON.stringify(data)}` : str); // eslint-disable-line
  }
};
