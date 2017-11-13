/* eslint-env mocha */
const cp = require("child_process");
let redisServer = null;

before(()=>{
  console.log("Starting suite-level redis server");
  redisServer = cp.spawn("redis-server");

  return new Promise(res=>redisServer.stdout.on("data", data=>{
    if (data.includes("Ready to accept connections")) {res();}
  }));
});

after(()=>{
  redisServer.kill();
});
