const { discord, knex } = require("../../bot");
const { User } = require("../../models");

async function start() {
  const guild = discord.guilds.get(process.env.DISCORD_GUILD_ID);
  guild.members.forEach(async gMember => {
    const user = await User.query()
      .where({ discord_id: gMember.id })
      .first();

    if (user) {
      await User.query()
        .patch({ username: gMember.user.tag })
        .where({ discord_id: gMember.id });
    } else {
      await User.query().insert({
        discord_id: gMember.id,
        username: gMember.user.tag
      });
    }
  });
}

module.exports.start = start;

//Add user to DB on join
discord.on("guildMemberAdd", async gMember => {
  console.log(`Guild member join: ${gMember.user.tag}`);
  await User.query().insert({
    discord_id: gMember.id,
    username: gMember.user.tag
  });
});

//Remove user from DB on leave
discord.on("guildMemberRemove", async gMember => {
  console.log(`Guild member left: ${gMember.user.tag}`);
  const user = await User.query()
    .where({ discord_id: gMember.id })
    .first();

  const mUser = user.mumble();
  if (mUser) mUser.kick("You were removed from the discord server");

  await User.query().deleteById(user.id);
});
