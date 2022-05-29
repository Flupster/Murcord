const log4js = require("log4js");

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    redis: { type: "@log4js-node/redis", channel: "murcord" },
  },
  categories: { default: { appenders: ["out", "redis"], level: log4js.levels.ALL } },
});

module.exports = log4js;
