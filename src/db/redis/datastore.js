const util = require("util");
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;

let client = null;
let promisified = ["get", "del", "set", "sadd", "srem", "hmset", "hgetall", "hdel", "smembers", "flushall", "sismember", "exists"];

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
  setHas(key, val) {
    return promisified.sismember(key, val);
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
  keyExists(key) {
    return promisified.exists(key);
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
  },
  hasKey(key) {
    return promisified.exists(key);
  },
  multi(cmds) {
    const apiMap = {
      setRemove: "srem",
      setAdd: "sadd",
      setString: "set",
      getString: "get",
      setIsMember: "sismember",
      patchHash: "hmset",
      removeHashField: "hdel"
    };

    return new Promise((res, rej)=>{
      client.multi(cmds.map(cmdArr=>{
        cmdArr[0] = apiMap[cmdArr[0]];
        return cmdArr;
      })).exec((err, resp)=>{
        return err ? rej(err) : res(resp);
      });
    });
  }
};
