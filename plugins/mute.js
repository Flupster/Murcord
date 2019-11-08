const { mumble, redis } = require("../bot");

exports.start = () => {
  mumble.on("connect", user => {
    redis.get(`mute:${user.userid}`).then(muted => {
      if (muted) user.setMute();
    });
  });

  mumble.on("userMuteChange", (user, muted) => {
    muted
      ? redis.set(`mute:${user.userid}`, 1)
      : redis.del(`mute:${user.userid}`);
  });
};
