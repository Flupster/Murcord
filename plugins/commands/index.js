const fs = require("fs");
const CommandLog = require("../../db/models/CommandLog");
const { Collection } = require("discord.js");
const { discord } = require("../../bot");

exports.start = () => {
  discord.commands = new Collection();

  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const command = require("./" + file);
    discord.commands.set(command.name, command);
  }

  commandSync();

  discord.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
      CommandLog.create({
        discordId: interaction.user.id,
        channelId: interaction.channelId,
        commandName: interaction.commandName,
        commandArgs: interaction.options.data,
      });

      if (!discord.commands.has(interaction.commandName)) return;

      try {
        await discord.commands
          .get(interaction.commandName)
          .execute(interaction);
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: "There was an error, PM floppy to fix",
          ephemeral: true,
        });
      }
    }

    if (interaction.isSelectMenu()) {
      await discord.commands
        .get(interaction.message.interaction.commandName)
        .onSelectMenuChange(interaction);
    }

    if (interaction.isButton()) {
      await discord.commands
        .get(interaction.message.interaction.commandName)
        .onButtonClick(interaction);
    }
  });
};

async function commandSync() {
  const guild = discord.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  const deployed = await discord.guilds.cache
    .get(process.env.DISCORD_GUILD_ID)
    .commands.fetch();

  // Register unregistered commands
  discord.commands
    .map((x) => x.name)
    .filter((x) => !deployed.map((x) => x.name).includes(x))
    .forEach(async (commandName) => {
      console.log(`DiscordCommands: Deployed command '${commandName}'`);
      const command = discord.commands.get(commandName);

      guild.commands.create(command).then(async (appCommand) => {
        if (!command.permissions) return;
        return await appCommand.permissions.set({
          permissions: command.permissions,
        });
      });
    });

  // Unregister deleted commands
  deployed.forEach(async (deployedCommand) => {
    if (!discord.commands.get(deployedCommand.name)) {
      console.log(`DiscordCommands: Removed command '${deployedCommand.name}'`);
      return await guild.commands.delete(deployedCommand.id);
    }
  });
}
