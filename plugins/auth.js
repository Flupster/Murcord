const { discord, mumble, redis, logger } = require("../bot");
const log = logger.getLogger("auth");
const User = require("../db/models/User");

exports.start = async () => {
  // Delete old cache
  const keys = await redis.keys("user:cache:*");
  if (keys.length > 0) await redis.del(...keys);

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

  log.info("Plugin Loaded");
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
  log.debug("Updated user cache", user.discordId);
};

//Add user to DB on join
discord.on("guildMemberAdd", async (member) => {
  //this is jank fix later with some auto incrementing id
  const mumbleId = (await User.findOne().sort({ mumbleId: -1 })).mumbleId + 1;
  await User.create({
    mumbleId,
    discordId: member.id,
    username: member.user.tag,
  });

  log.info(`Guild member join: ${member.user.tag}`);
});

// On role / display name change
discord.on("guildMemberUpdate", async (old, update) => {
  const user = await User.findOne({ discordId: update.id });
  this.updateUserCache(user);

  if (old.displayName !== update.displayName) {
    const muser = mumble.users.get(user.mumbleId);
    if (muser) muser.setNickname(update.displayName);
  }

  log.info(`Guild member update: ${update.user.id}`);
});

// remove from cache on user leave
discord.on("guildMemberRemove", async (member) => {
  const user = await User.findOne({ discordId: member.id });

  const mUser = mumble.users.get(user.mumbleId);
  if (mUser) {
    mUser.kick("You were removed from the discord server");
  }

  await User.deleteOne({ discordId: member.id });
  await redis.del(`user:cache:${user.discordId}`);
  await redis.del(`user:cache:${user.username}`);

  log.info(`Guild member left: ${member.user.id}`);
});
