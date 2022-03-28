const { discord, redis, mumble } = require("../../bot");
const { MessageEmbed } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const MumbleStats = require("../../db/models/MumbleStats");
const User = require("../../db/models/User");

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
    const discordUser = await User.findOne({ discordId: user.id });
    const stats = await MumbleStats.findOne({ mumbleId: discordUser.mumbleId });

    const message = await redis.get(`seen:discord:message:${user.id}`);
    const presence = await redis.get(`seen:discord:presence:${user.id}`);

    const seen = {
      discordPresence: parseInt(presence) ?? 0,
      discordMessage: message ? JSON.parse(message).date : 0,
      mumble: stats ? stats.lastSeen.getTime() : 0,
    };

    // if online in discord currently
    const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const guildMember = await guild.members.fetch(user.id);

    if (guildMember.presence && guildMember.presence.status === "online") {
      seen.discordPresence = Infinity;
    }

    // if online in mumble currently
    if (stats && mumble.users.get(stats.mumbleId)) {
      seen.mumble = Infinity;
    }

    const humanDuration = (value) => {
      switch (value) {
        case Infinity:
          return "Now";
        case 0:
          return "Never";
        default:
          return humanizeDuration(+new Date() - value, {
            round: true,
            conjunction: ", ",
            largest: 2,
          });
      }
    };

    const humanLast = (value) => {
      switch (value) {
        case Infinity:
          return "\u200B";
        case 0:
          return "\u200B";
        default:
          return new Date(value).toUTCString();
      }
    };

    const embed = new MessageEmbed()
      .setAuthor(guildMember.displayName, user.avatarURL())
      .addFields([
        {
          name: "Mumble",
          value: humanDuration(seen.mumble),
          inline: true,
        },
        {
          name: "\u200B",
          value: humanLast(seen.mumble),
          inline: true,
        },
        { name: "\u200B", value: "\u200B" },
        {
          name: "Discord Message",
          value: humanDuration(seen.discordMessage),
          inline: true,
        },
        {
          name: "\u200B",
          value: humanLast(seen.discordMessage),
          inline: true,
        },
        { name: "\u200B", value: "\u200B" },
        {
          name: "Discord",
          value: humanDuration(seen.discordPresence),
          inline: true,
        },
        {
          name: "\u200B",
          value: humanLast(seen.discordPresence),
          inline: true,
        },
      ]);

    return interaction.reply({ content: user.toString(), embeds: [embed] });
  },
};
