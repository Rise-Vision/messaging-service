const podname = process.env.podname;
const Primus = require("primus");
const primusSetup = require("./src/websocket/primus-setup");
const express = require("express");
const http = require("http");
const defaultPort = 80;
const port = process.env.MS_PORT || defaultPort;
const app = express();
const pubsubConnectorPOST = require("./src/webhooks/pubsub-connector/post-handler");
const coreGET = require("./src/webhooks/core/get-handler");
const presencePOST = require("./src/webhooks/presence/post-handler");
const presenceOPTIONS = require("./src/webhooks/presence/options-handler");
const activationPOST = require("./src/webhooks/display-activation/post-handler");
const activationOPTIONS = require("./src/webhooks/display-activation/options-handler");
const jsonParser = require("body-parser").json();
const server = http.createServer(app);
const redisPubsub = require("./src/redis-pubsub");
const datastore = require("./src/db/redis/datastore");
const dbApi = require("./src/db/api");
const pkg = require("./package.json");
const logger = require("./src/logger");
const gcs = require("./src/gcs");
const handlers = require("./src/event-handlers/messages");
const heartbeatExpiryPingMultiple = 1.5;
const MStoS = 1000;

process.on("SIGUSR2", logger.debugToggle);
Error.stackTraceLimit = 50;

const primus = new Primus(server, {transformer: "websockets", pathname: "messaging/primus"});
primusSetup.init(primus);

dbApi.setHeartbeatExpirySeconds(primus.options.pingInterval * heartbeatExpiryPingMultiple / MStoS);

app.get("/messaging", function(req, res) {
  res.send(`Messaging Service: ${podname} ${pkg.version}`);
});

app.get("/", (req, res)=>res.end());

app.get("/messaging/core", coreGET);

app.post("/messaging/pubsub", jsonParser, pubsubConnectorPOST);

app.post("/messaging/presence", jsonParser, presencePOST);
app.options("/messaging/presence", jsonParser, presenceOPTIONS);

app.post("/messaging/activation", jsonParser, activationPOST);
app.options("/messaging/activation", jsonParser, activationOPTIONS);

server.on("close", ()=>{logger.log("closed");});
server.listen(port, (err) => {
  if (err) {
    return console.error("something bad happened", err);
  }

  datastore.initdb();
  redisPubsub.init();
  gcs.init();
  handlers.init();
  console.log(`server is listening on ${port}`);
});

module.exports = {
  dropSocketsAfterTimeMS(ms) {
    server.on("connection", socket=>{
      setTimeout(()=>{
        try {
          socket.destroy();
        } catch(e) {} // eslint-disable-line
      }, ms);
    });
  },
  kill() {
    server.close();
  }
};
