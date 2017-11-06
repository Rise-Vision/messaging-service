const crypto = require("crypto");
const keyBytes = 32
const keyEnv = process.env.MSTOKEN_KEY || "0".repeat(keyBytes);
const preSharedKey = Buffer.from(keyEnv, "hex");

module.exports = {
  encryptAndHash(obj) {
    const inputBuffer = Buffer.from(JSON.stringify(obj));
    const hasher = crypto.createHash("sha1");
    const cipher = crypto.createCipheriv("aes-128-ecb", preSharedKey, "");

    hasher.update(cipher.update(inputBuffer));
    hasher.update(cipher.final());
    return hasher.digest("hex");
  }
};
