const Primus = require('primus');
const express = require('express');
const http = require('http');
const defaultPort = 80;
const port = process.env.MS_PORT || defaultPort;
const app = express();
const server = http.createServer(app);
const datastore = require("./src/db/redis/datastore.js");
const watch = require("./src/messages/watch.js");
const pkg = require("./package.json");
const podname = process.env.podname;
const gcs = require("./src/version-compare/gcs.js");

const primus = new Primus(server, {transformer: 'uws', pathname: 'messaging/primus'});

primus.on('connection', (spark) => {
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

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  datastore.initdb();
  gcs.init();
  console.log(`server is listening on ${port}`);
})
