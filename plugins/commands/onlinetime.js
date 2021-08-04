const { User } = require("../../models");
const HumanizeDuration = require("humanize-duration");

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
    const user = User.query().findOne({ discord_id: discordUser.id });
    const stats = await User.relatedQuery("mumble_stats").for(user).first();

    if (!stats) {
      return interaction.reply(`${discordUser} hasn't been on mumble :O`);
    }

    const time = HumanizeDuration(stats.OnlineSecs() * 1000, {
      round: true,
      conjunction: " and ",
    });

    return interaction.reply(
      `${discordUser} total mumble connection time: **${time}**`
    );
  },
};
