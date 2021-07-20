const mumble = require("./mumble");
const events = require("./events");

mumble.connect();

module.exports = mumble;
module.exports.auth = auth;
module.exports.on = (c, l) => events.on(c, l);
