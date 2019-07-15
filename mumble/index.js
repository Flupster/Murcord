const mumble = require('./mumble.js')
const auth = require('./auth.js')

mumble.connect()
auth.start()

module.exports = mumble
module.exports.auth = auth
module.exports.on = (c, l) => mumble.events.on(c, l)