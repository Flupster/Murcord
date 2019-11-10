const Emitter = require("events").EventEmitter;
const mumble = require("./mumble");
const Redis = require("ioredis");
const redis = new Redis();
module.exports = emitter = new Emitter();

if (process.env.MUMBLE_LOGS === "true") {
  let logTS = +new Date() / 1000;
  setInterval(() => {
    mumble.server.getLog(0, 50).then(logs => {
      logs
        .reverse()
        .filter(x => x.timestamp > logTS)
        .forEach(log => {
          emitter.emit("mumblelog", log.txt, log.timestamp);
        });

      logTS = logs[logs.length - 1].timestamp;
    });
  }, 1000);
}

redis.subscribe("mumble:event");
redis.on("message", (channel, message) => {
  const data = JSON.parse(message);
  const type = data.type;
  delete data.type;

  if (type === "change") {
    data.new = data.state;
    data.old = mumble.users.get(data.state.userid);

    //this timeout is here due to race conditions
    //redis pumps a connect then change in < 1ns too fast for node

    setTimeout(
      () => {
        if (!data.old) data.old = mumble.users.get(data.state.userid);
        data.diff = Object.keys(data.new).filter(k => {
          const diffKeys = [
            "mute",
            "deaf",
            "suppress",
            "prioritySpeaker",
            "selfMute",
            "selfDeaf",
            "recording",
            "channel",
            "comment",
            "name"
          ];

          return diffKeys.includes(k) && data.new[k] !== data.old[k];
        });

        //emit an event for state changes example: mumble.on('userPrioritySpeakerChange') and mumble.on('userRecordingChange')
        //arguments are: 1. current user state, 2. new key value, 3. old key value
        data.diff.forEach(key => {
          emitter.emit(
            "user" + key.charAt(0).toUpperCase() + key.slice(1) + "Change",
            data.new,
            data.new[key],
            data.old[key]
          );
        });

        emitter.emit("userStateChange:" + data.state.userid, data.state);
      },
      data.old ? 0 : 5
    );
  }

  emitter.emit(type, ...Object.keys(data).map(key => data[key]));
});
