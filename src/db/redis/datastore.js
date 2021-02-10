const util = require("util");
const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? "127.0.0.1" : gkeHostname;

let client = null;
let promisified = ["get", "del", "set", "sadd", "srem", "hmset", "hgetall", "hdel", "hexists", "smembers", "flushall", "sismember", "exists", "sunion", "scard"];

module.exports = {
  initdb(dbclient = null) {
    if (!dbclient && client) {return client;}

    client = dbclient || redis.createClient({host: redisHost});

    if (!dbclient) {client.on("error", console.error);}

    if (!Array.isArray(promisified)) {return;}

    promisified = promisified.reduce((obj, el)=>{
      return {...obj, [el]: util.promisify(client[el].bind(client))};
    }, {});
  },
  setAdd(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}
    return promisified.sadd(key, ...vals);
  },
  setUnion(keys) {
    if (!Array.isArray(keys)) {throw Error("expected array");}
    return promisified.sunion(...keys);
  },
  setHas(key, val) {
    return promisified.sismember(key, val);
  },
  deleteKeys(keys) {
    if (!Array.isArray(keys)) {throw Error("expected array");}
    return promisified.del(...keys);
  },
  removeHashField(key, field) {
    return promisified.hdel(key, field);
  },
  removeHashFields(key, fields) {
    if (fields.length === 0) {return Promise.resolve(0);}
    return promisified.hdel(key, fields);
  },
  setRemove(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}
    return promisified.srem(key, ...vals);
  },
  setCount(key) {
    return promisified.scard(key);
  },
  patchHash(key, patchObj) {
    return promisified.hmset(key, patchObj);
  },
  hashFieldExists(key, field) {
    return promisified.hexists(key, field);
  },
  quit(cb) {
    client.quit(cb);
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
  setString(...args) {
    return promisified.set(...args);
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
      deleteKey: "del",
      setString: "set",
      getString: "get",
      getSet: "smembers",
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
