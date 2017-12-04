/* eslint-env mocha */
const cp = require("child_process");
const reasonableResponseTime = 1000;
const testPort = 9228;
let redisServer = null;
let msServer = null;

before(()=>{
  console.log("Starting suite-level redis server");
  redisServer = cp.spawn("redis-server");

  return new Promise(res=>redisServer.stdout.on("data", data=>{
    if (data.includes("Ready to accept connections")) {res();}
  })).then(startMS);
});

after(()=>{
  msServer.kill();
  redisServer.kill();
});

function startMS() {
    console.log("Starting suite-level messaging server");

    process.env.MS_PORT = testPort;
    process.env.NODE_ENV = "test";

    msServer = require("../../index.js");
    msServer.dropSocketsAfterTimeMS(reasonableResponseTime);
}
