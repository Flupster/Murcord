const mumble = require("./mumble");
const events = require("./events");
const auth = require("./auth");


mumble.connect();
auth.start();

module.exports = mumble;
module.exports.auth = auth;
module.exports.on = (c, l) => events.on(c, l);
