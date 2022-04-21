const { discord, redis } = require("../bot");
const User = require("../db/models/User");

exports.start = async () => {
  // Delete old cache
  const keys = await redis.keys("user:cache:*");
  await redis.del(...keys);

  // Insert new cache
  const users = await User.find();
  users.filter((u) => u.password !== null).forEach(this.updateUserCache);
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

// On role / display name change
discord.on("guildMemberUpdate", async (_, update) => {
  const user = await User.findOne({ discordId: update.id });
  this.updateUserCache(user);
});

// remove from cache on user leave
discord.on("guildMemberRemove", async (member) => {
  const user = await User.findOne({ discordId: member.id });
  await redis.del(`user:cache:${user.discordId}`);
  await redis.del(`user:cache:${user.username}`);
});
