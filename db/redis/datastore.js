const redis = require("redis");
let client = null;

module.exports = {
  initdb(dbclient = null) {
    client = dbclient || redis.createClient();
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
  }
};
