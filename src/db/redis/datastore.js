const util = require("util");
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? null : gkeHostname;

let client = null;
let promisified = ["get", "set", "sadd", "hmset", "hgetall", "smembers", "flushall"];

module.exports = {
  initdb(dbclient = null) {
    client = dbclient || redis.createClient({host: redisHost});

    promisified = promisified.reduce((obj, el)=>{
      return Object.assign(obj, {[el]: util.promisify(client[el].bind(client))});
    }, {});
  },
  setAdd(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}
    return promisified.sadd(key, ...vals);
  },
  patchHash(key, patchObj) {
    return promisified.hmset(key, patchObj);
  },
  ungracefulQuit() {
    client.end(true);
  },
  getHash(key) {
    return promisified.hgetall(key);
  },
  getSet(key) {
    return promisified.smembers(key);
  },
  getString(key) {
    return promisified.get(key);
  },
  setString(key, str) {
    return promisified.set(key, str);
  },
  eraseEntireDb() {
    return promisified.flushall();
  }
};
