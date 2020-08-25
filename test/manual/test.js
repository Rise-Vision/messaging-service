const Primus = require("primus");

const Socket = Primus.createSocket({transformer: "websockets", pathname: '/messaging/primus'});

const connection = new Socket(`https://services-stage.risevision.com/messaging?displayId=test-manual&machineId=1234`, {
  reconnect: {
    max: 1800000,
    min: 5000,
    retries: Infinity
  },
  pingTimeout: 45000
});

connection.on("open", ()=>{
  console.log(`messaging service connected`);
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
