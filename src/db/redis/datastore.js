const util = require("util");
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;

let client = null;
let promisified = ["get", "del", "set", "sadd", "srem", "hmset", "hgetall", "hdel", "smembers", "flushall"];

module.exports = {
  initdb(dbclient = null) {
    client = dbclient || redis.createClient({host: redisHost});

    if (!Array.isArray(promisified)) {return;}

    promisified = promisified.reduce((obj, el)=>{
      return {...obj, [el]: util.promisify(client[el].bind(client))};
    }, {});
  },
  setAdd(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}
    return promisified.sadd(key, ...vals);
  },
  deleteKey(keys) {
    return promisified.del(...keys);
  },
  removeHashField(key, field) {
    return promisified.hdel(key, field);
  },
  setRemove(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}
    return promisified.srem(key, ...vals);
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
