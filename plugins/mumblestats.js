const { knex, mumble, discord } = require("../bot");
const { User, MumbleStats } = require("../models");

exports.start = () => {
  mumble.users.forEach(async mUser => {
    const stats = await MumbleStats.query().findById(mUser.userid);
    if (!stats) {
      await MumbleStats.query().insert({
        id: mUser.userid,
        connects: 1
      });
    }
  });

  mumble.on("connect", async mUser => {
    const user = await knex("mumble_stats")
      .where({ id: mUser.userid })
      .first();

    if (user) {
      await knex("mumble_stats")
        .where({ id: mUser.userid })
        .increment("connects");
    } else {
      await knex("mumble_stats").insert({
        id: mUser.userid,
        connects: 1,
        online_secs: 0
      });
    }
  });

  mumble.on("disconnect", async mUser => {
    await knex("mumble_stats")
      .where({ id: mUser.userid })
      .update({
        last_seen: new Date(),
        online_secs: knex.raw(`online_secs + ${mUser.onlinesecs}`)
      });
  });

  console.log("Mumble Stats plugin loaded");
};

mumble.on("message", async (author, message) => {
  if (message.text.startsWith("!onlinetime")) {
    const stats = await MumbleStats.query()
      .where({ id: author.userid })
      .first();

    mumble.users.get(author.userid).send(secondsToDhms(stats.OnlineSecs()));
  }
});

discord.on("message", async message => {
  if (message.content.startsWith("!onlinetime")) {
    const user = User.query().findOne({ discord_id: message.author.id });
    const stats = await User.relatedQuery("mumble_stats")
      .for(user)
      .first();

    if (stats) {
      message.reply(
        `Your total mumble online time is: ${secondsToDhms(stats.OnlineSecs())}`
      );
    } else {
      message.reply("You havn't been on mumble yet?!");
    }
  }
});

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}
