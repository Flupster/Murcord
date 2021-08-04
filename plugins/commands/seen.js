const { discord, redis, mumble } = require("../../bot");
const { User } = require("../../models");
const humanizeDuration = require("humanize-duration");

discord.on("presenceUpdate", async (oldPresence, presence) => {
  if (oldPresence && oldPresence.status === "online") {
    await redis.set(`seen:discord:presence:${presence.userId}`, +new Date());
  }
});

discord.on("messageCreate", async (message) => {
  const data = JSON.stringify({
    user: message.author.id,
    channel: message.channel.id,
    message: message.id,
    content: message.content,
    date: +new Date(),
  });

  await redis.set(`seen:discord:message:${message.author.id}`, data);
});

mumble.on("disconnect", async (user) => {
  await redis.set(`seen:mumble:${user.userid}`, +new Date());
});

function MostRecent(date) {
  if (date === Infinity) {
    return "is online right now";
  }

  if (date === 0) {
    return "has never been online";
  }

  const recent = new Date(date).toUTCString();
  return `was last seen at \`${recent}\``;
}

module.exports = {
  name: "seen",
  description: "Last time user was seen",
  options: [
    {
      name: "user",
      description: "The user to search",
      type: "USER",
      required: true,
    },
  ],
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const stats = await User.relatedQuery("mumble_stats")
      .for(User.query().findOne({ discord_id: user.id }))
      .first();

    const message = await redis.get(`seen:discord:message:${user.id}`);

    const seen = {
      Discord: (await redis.get(`seen:discord:presence:${user.id}`)) ?? 0,
      "Discord Message": message ? JSON.parse(message).date : 0,
      Mumble: stats.last_seen.getTime(),
    };

    // if online in discord currently
    const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const guildMember = await guild.members.fetch(user.id);

    if (guildMember.presence && guildMember.presence.status === "online") {
      seen["Discord Online"] = Infinity;
    }

    // if online in mumble currently
    const mUser = mumble.users.get(stats.id);
    if (mUser) {
      seen["Mumble Online"] = Infinity;
    }

    // sort
    const sorted = Object.keys(seen).sort((a, b) => seen[b] - seen[a]);

    const response = sorted.map((key) => {
      const value = seen[key];
      console.log({ key, value });
      if (value === Infinity) {
        return `${key}: \`Now\``;
      } else if (value === 0) {
        return `${key}: \`Never\``;
      } else {
        const humanize = humanizeDuration(+new Date() - value, {
          round: true,
          largest: 3,
          conjunction: " and ",
        });
        return `${key}: \`${humanize} ago\``;
      }
    });

    return interaction.reply(
      `${user} ${MostRecent(seen[sorted[0]])}\r\n` + response.join("\r\n")
    );
  },
};
