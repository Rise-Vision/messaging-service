const Primus = require('primus'),
      http = require('http');
      port = 80;
const server = http.createServer();
const podname = process.env.podname;

const primus = new Primus(server, {transformer: 'uws', pathname: '/messaging'});

primus.on('connection', (spark) => {
  spark.write(`Messaging Service WebSocket Connected: ${podname}`);
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
