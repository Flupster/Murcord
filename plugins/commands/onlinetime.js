const User = require("../../db/models/User");
const HumanizeDuration = require("humanize-duration");
const MumbleStats = require("../../db/models/MumbleStats");
const { mumble } = require("../../bot");

module.exports = {
  name: "onlinetime",
  description: "Total time on mumble",
  options: [
    {
      name: "user",
      description: "The user to search",
      type: "USER",
      required: false,
    },
  ],
  async execute(interaction) {
    const discordUser = interaction.options.getUser("user") || interaction.user;
    const user = await User.findOne({ discordId: discordUser.id });
    const stats = await MumbleStats.findOne({ mumbleId: user.mumbleId });

    if (!stats) {
      return interaction.reply(`${discordUser} hasn't been on mumble :O`);
    }

    const connectedSecs = mumble.users.get(user.mumbleId)?.onlinesecs ?? 0;
    const ms = (stats.onlineSecs + connectedSecs) * 1000;

    console.log({ connectedSecs, stats, user });
    const time = HumanizeDuration(ms, {
      round: true,
      conjunction: " and ",
    });

    return interaction.reply(
      `${discordUser} total mumble connection time: **${time}**`
    );
  },
};
