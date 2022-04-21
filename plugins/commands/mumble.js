const { mumble } = require("../../bot");
const User = require("../../db/models/User");
const { MessageEmbed } = require("discord.js");
const { updateUserCache } = require("../usercache");
const randomWords = require("random-words");

module.exports = {
  name: "mumble",
  description: "Get your mumble account information",
  options: [
    {
      name: "password",
      description: "The password you want to use",
      type: "STRING",
      required: false,
    },
  ],
  async execute(interaction) {
    const password = interaction.options.getString("password");
    const user = await User.findOne({ discordId: interaction.user.id });

    if (password) {
      user.password = password;
      updateUserCache(user);
      await user.save();

      //If they're on mumble kick them
      const muser = mumble.users.get(user.mumbleId);
      if (muser) muser.kick("Your password was changed");
    } else if (!user.password) {
      const newPassword = randomWords({ exactly: 3, join: "" });
      user.password = newPassword;
      await user.save();
    }

    const embed = new MessageEmbed()
      .setTitle("Your Mumble Information")
      .addFields(
        { name: "IP", value: "mumble.minusten.tv", inline: true },
        { name: "PORT", value: "64738", inline: true },
        { name: "\u200B", value: "\u200B" },
        { name: "Username", value: user.username, inline: true },
        { name: "Or Username", value: user.discordId, inline: true },
        { name: "Password", value: user.password }
      );

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
