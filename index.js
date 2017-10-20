const Primus = require('primus');
const express = require('express');
const http = require('http');
const port = 80;
const app = express();
const server = http.createServer(app);
const pkg = require("./package.json");
const podname = process.env.podname;

const primus = new Primus(server, {transformer: 'uws', pathname: 'messaging/primus'});

primus.on('connection', (spark) => {
  spark.write(`Messaging Service WebSocket Connected: ${podname} ${pkg.version}`);
});

app.get('/messaging', function(req, res) {
  res.send(`Messaging Service: ${podname} ${pkg.version}`);
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
