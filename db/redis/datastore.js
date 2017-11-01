const redis = require("redis");
const gkeHostname = "display-ms-redis-master";
const redisHost = process.env.NODE_ENV === "test" ? null : gkeHostname;

let client = null;

module.exports = {
  initdb(dbclient = null) {
    client = dbclient || redis.createClient(redisHost);
  },
  setAdd(key, vals) {
    if (!Array.isArray(vals)) {throw Error("expected array");}

    return new Promise((res, rej)=>{
      client.sadd(key, ...vals, (err, reply)=>{
        if (err) {return rej(err);}
        res(reply);
      });
    });
  },
  patchHash(key, patchObj) {
    return new Promise((res, rej)=>{
      client.hmset(key, patchObj, (err, reply)=>{
        if (err) {return rej(err);}
        res(reply);
      });
    });
  },
  ungracefulQuit() {
    client.end(true);
  },
  getHash(key) {
    return new Promise((res, rej)=>{
      client.hgetall(key, (err, reply)=>{
        if (err) {return rej(err);}
        res(reply);
      });
    });
  },
  getSet(key) {
    return new Promise((res, rej)=>{
      client.smembers(key, (err, reply)=>{
        if (err) {return rej(err);}
        res(reply);
      });
    });
  },
  eraseEntireDb() {
    return new Promise((res, rej)=>{
      client.flushall((err, reply)=>{
        if (err) {return rej(err);}
        res(reply);
      });
    });
  }
};
