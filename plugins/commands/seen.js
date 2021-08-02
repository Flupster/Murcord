const { User } = require("../../models");

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
    const discordUser = interaction.options.getUser("user");
    const user = User.query().findOne({ discord_id: discordUser.id });
    const stats = await User.relatedQuery("mumble_stats").for(user).first();

    return interaction.reply(
      `${discordUser} was last seen ${stats.last_seen.toUTCString()}`
    );
  },
};
