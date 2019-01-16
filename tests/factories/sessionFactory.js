const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");

module.exports = (user) => {  // exporting a function
  const sessionObject = {
    passport: {
      user: user._id.toString() //monogoose _id is a object so convert to a string
    }
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString(
    "base64"
  );  
  const keygrip = new Keygrip([keys.cookieKey]);
  const sig = keygrip.sign("session=" + session);

  return { session, sig }; // once function is called return these data
};
