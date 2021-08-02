const { knex, mumble } = require("../../bot");
const { MessageEmbed } = require("discord.js");

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
    const user = await knex("users")
      .where({ discord_id: interaction.user.id })
      .first();

    if (password) {
      await knex("users").where({ id: user.id }).update({ password });
      user.password = password;

      //If they're on mumble kick them
      const muser = mumble.users.get(user.id);
      if (muser) muser.kick("Your password was changed");
    }

    const embed = new MessageEmbed()
      .setTitle("Your Mumble Information")
      .addFields(
        { name: "IP", value: "mumble.minusten.tv", inline: true },
        { name: "PORT", value: "64738", inline: true },
        { name: "\u200B", value: "\u200B" },
        { name: "Username", value: user.username, inline: true },
        { name: "Or Username", value: user.discord_id, inline: true },
        { name: "Password", value: user.password }
      );

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
