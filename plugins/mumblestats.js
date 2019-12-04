const { knex, mumble } = require("../bot");

exports.start = () => {
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
