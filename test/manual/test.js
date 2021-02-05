const Primus = require("primus");
const MS_PORT = process.env.MS_PORT;
const SCHEDULE_ID = process.env.SCHEDULE_ID;
const DISPLAY_ID = process.env.DISPLAY_ID || "test-manual";
const endpoint = MS_PORT ? `http://localhost:${MS_PORT}` :
      process.env.MS_STAGING ? "https://services-stage.risevision.com" :
      "https://services.risevision.com";

const Socket = Primus.createSocket({transformer: "websockets", pathname: '/messaging/primus'});

const urlParams = SCHEDULE_ID ?
  `scheduleId=${SCHEDULE_ID}&endpointId=1234` :
  `displayId=${DISPLAY_ID}&machineId=1234`;
const url = `${endpoint}/messaging?${urlParams}`;

console.log(`Connecting to ${ url }`);

const connection = new Socket(url, {
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
