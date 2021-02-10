const serverKey = process.env.NODE_ENV === "test" ?
  "TEST" :
  process.env.CORE_SENDER_KEY || String(Math.random());

module.exports = {serverKey};
