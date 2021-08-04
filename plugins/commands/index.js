const fs = require("fs");
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
      if (!discord.commands.has(interaction.commandName)) return;

      try {
        await discord.commands
          .get(interaction.commandName)
          .execute(interaction);
        console.log(`DiscordCommands: ran '${interaction.commandName}'`);
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: "There was an error, PM floppy to fix",
          ephemeral: true,
        });
      }
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
    .forEach((commandName) => {
      console.log(`DiscordCommands: Deployed command '${commandName}'`);
      guild.commands.create(discord.commands.get(commandName));
    });

  // Unregister deleted commands
  deployed.forEach(async (deployedCommand) => {
    if (!discord.commands.get(deployedCommand.name)) {
      console.log(`DiscordCommands: Removed command '${deployedCommand.name}'`);
      return await guild.commands.delete(deployedCommand.id);
    }
  });
}
