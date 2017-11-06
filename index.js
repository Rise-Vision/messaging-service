const Primus = require('primus');
const express = require('express');
const http = require('http');
const defaultPort = 80;
const port = process.env.MS_PORT || defaultPort;
const app = express();
const server = http.createServer(app);
const datastore = require("./db/redis/datastore.js");
const watch = require("./messages/watch.js");
const pkg = require("./package.json");
const podname = process.env.podname;
const gcs = require("version-compare/gcs.js");

const primus = new Primus(server, {transformer: 'uws', pathname: 'messaging/primus'});

primus.on('connection', (spark) => {
  spark.write(`Messaging Service WebSocket Connected: ${podname} ${pkg.version}`);
  spark.on("data", (data)=>{
    if (!data) {return;}
    if (!data.msg) {return;}

    if (data.msg.toUpperCase() === "WATCH") {
      return watch(data.data).then(spark.write.bind(spark));
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
