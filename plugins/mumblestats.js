const { mumble } = require("../bot");
const MumbleStats = require("../db/models/MumbleStats");

exports.start = () => {
  mumble.users.forEach(async (mUser) => {
    const stats = await MumbleStats.findOne({ mumbleId: mUser.userid });
    if (!stats) {
      await MumbleStats.create({
        mumbleId: mUser.userid,
        lastSeen: new Date(),
        connects: 1,
        onlineSecs: 0,
      });
    }
  });

  console.log("[Mumble Stats] Loaded");
};

mumble.on("connect", async (mUser) => {
  const user = await MumbleStats.findOne({ mumbleId: mUser.userid });

  if (user) {
    user.connects++;
    await user.save();
  } else {
    await MumbleStats.create({
      mumbleId: mUser.userid,
      lastSeen: new Date(),
      connects: 1,
      onlineSecs: 0,
    });
  }
});

mumble.on("disconnect", async (mUser) => {
  const user = await MumbleStats.findOne({ mumbleId: mUser.userid });
  user.lastSeen = new Date();
  user.onlineSecs += mUser.onlinesecs;
  await user.save();
});
