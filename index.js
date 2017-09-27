const Primus = require('primus'),
      http = require('http');
      port = 80;

const server = http.createServer(()=>{}),

primus = new Primus(server, {transformer: 'uws'});

primus.on('connection', (spark) => {
  spark.write(server.address());
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  };

  console.log(`server is listening on ${port}`);
})
