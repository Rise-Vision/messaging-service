const Primus = require("primus");
const MS_PORT = process.env.MS_PORT;
const endpoint = MS_PORT ? `http://localhost:${MS_PORT}` :
      process.env.MS_STAGING ? "https://services-stage.risevision.com/" :
      "https://services.risevision.com";

const Socket = Primus.createSocket({transformer: "websockets", pathname: '/messaging/primus'});

const connection = new Socket(`${endpoint}/messaging?displayId=test-manual&machineId=1234`, {
  reconnect: {
    max: 600000,
    min: 5000,
    retries: Infinity
  },
  pingTimeout: 45000
});

connection.on("open", ()=>{
  console.log(`messaging service connected`, endpoint);
});

connection.on("close", ()=>{
  console.log(`messaging service connection closed`);
});

connection.on("end", ()=>{
  console.log(`messaging service disconnected`);
});

connection.on("data", (data)=>{
  console.dir(data);
});

connection.on("error", (error)=>{
  console.log(`messaging error`);
  console.error(error);
});
