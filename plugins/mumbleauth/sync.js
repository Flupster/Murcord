const { mumble, discord } = require("../../bot");
const User = require("../../db/models/User");

async function start() {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const members = await guild.members.fetch();
  members.forEach(async (member) => {
    const user = await User.findOne({ discordId: member.id });

    if (user) {
      user.username = member.user.tag;
      await user.save();
    } else {
      //this is jank fix later with some auto incrementing id
      const mumbleId =
        (await User.findOne().sort({ mumbleId: -1 })).mumbleId + 1;
      await User.create({
        mumbleId,
        discordId: member.id,
        username: member.user.tag,
      });
    }
  });
}

module.exports.start = start;

//Add user to DB on join
discord.on("guildMemberAdd", async (member) => {
  console.log(`Guild member join: ${member.user.tag}`);

  //this is jank fix later with some auto incrementing id
  const mumbleId = (await User.findOne().sort({ mumbleId: -1 })).mumbleId + 1;
  await User.create({
    mumbleId,
    discordId: member.id,
    username: member.user.tag,
  });
});

//Remove user from DB on leave
discord.on("guildMemberRemove", async (member) => {
  console.log(`Guild member left: ${member.user.tag}`);

  const user = await User.findOne({ discordId: member.id });

  const mUser = mumble.users.get(user.mumbleId);
  if (mUser) {
    mUser.kick("You were removed from the discord server");
  }

  await User.deleteOne({ discordId: member.id });
});
