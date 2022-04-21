const { discord, mumble, redis } = require("../bot");
const User = require("../db/models/User");

exports.start = async () => {
  // Delete old cache
  const keys = await redis.keys("user:cache:*");
  await redis.del(...keys);

  // Insert new cache
  const users = await User.find();
  users.filter((u) => u.password !== null).forEach(this.updateUserCache);

  // update user DB
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
};

exports.updateUserCache = async (user) => {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const dUser = await guild.members.fetch(user.discordId);

  if (!dUser) return;

  const roles = dUser.roles.cache
    .filter((r) => r.name !== "@everyone")
    .map((r) => r.name);

  const data = JSON.stringify({
    mumbleId: user.mumbleId,
    discordId: user.discordId,
    displayName: dUser.displayName,
    password: user.password,
    roles: roles,
  });

  await redis.set(`user:cache:${user.discordId}`, data);
  await redis.set(`user:cache:${user.username}`, data);
};

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

// On role / display name change
discord.on("guildMemberUpdate", async (_, update) => {
  const user = await User.findOne({ discordId: update.id });
  this.updateUserCache(user);

  if (old.displayName !== update.displayName) {
    mumble.users.get(user.mumbleId).setNickname(update.displayName);
  }
});

// remove from cache on user leave
discord.on("guildMemberRemove", async (member) => {
  console.log(`Guild member left: ${member.user.tag}`);

  const user = await User.findOne({ discordId: member.id });

  const mUser = mumble.users.get(user.mumbleId);
  if (mUser) {
    mUser.kick("You were removed from the discord server");
  }

  await User.deleteOne({ discordId: member.id });
  await redis.del(`user:cache:${user.discordId}`);
  await redis.del(`user:cache:${user.username}`);
});
