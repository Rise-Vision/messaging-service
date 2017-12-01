const Primus = require('primus');
const express = require('express');
const http = require('http');
const defaultPort = 80;
const port = process.env.MS_PORT || defaultPort;
const app = express();
const pubsub = require("./src/pubsub");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const server = http.createServer(app);
const displayConnections = require("./src/messages/display-connections.js");
const datastore = require("./src/db/redis/datastore.js");
const watch = require("./src/messages/watch.js");
const pkg = require("./package.json");
const podname = process.env.podname;
const logger = require("./src/logger.js");
const gcs = require("./src/version-compare/gcs.js");
const querystring = require("querystring");
const url = require("url");

const primus = new Primus(server, {transformer: 'uws', pathname: 'messaging/primus'});

process.on("SIGUSR2", logger.debugToggle);

primus.authorize((req, done)=>{
  const {displayId, machineId} = querystring.parse(url.parse(req.url).query);
  const invalidIds = ["undefined", "null"];

  if (!displayId || !machineId || [displayId, machineId].some(id=>invalidIds.includes(id))) {
    logger.log(`Missing connection parameters (displayId: ${displayId}, machineId: ${machineId})`);
    return done({
      statusCode: 400,
      message: "displayId/machineId required"
    });
  }

  done();
});

primus.on('connection', (spark) => {
  logger.log(`Spark connection from ${spark.address}`);

  displayConnections.put(spark);

  spark.on("end", ()=>{
    displayConnections.remove(spark);
  });

  spark.on("data", (data)=>{
    if (!data) {return;}
    if (!data.topic) {return;}

    if (data.topic.toUpperCase() === "WATCH") {
      return watch(Object.assign({}, data, spark.query))
      .then(spark.write.bind(spark));
    }
  });
});

app.get('/messaging', function(req, res) {
  res.send(`Messaging Service: ${podname} ${pkg.version}`);
});

app.post('/messaging/pubsub', jsonParser, pubsub);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  datastore.initdb();
  gcs.init();
  console.log(`server is listening on ${port}`);
});

server.on("close", ()=>{logger.log("closed");});

module.exports = {
  dropSocketsAfterTimeMS(ms) {
    server.on("connection", socket=>setTimeout(socket.destroy, ms));
  },
  kill() {
    server.close();
  }
};
