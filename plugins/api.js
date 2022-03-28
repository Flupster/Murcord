const { discord, express } = require("../bot");

exports.start = async () => {
  console.log("[API] Plugin Loaded");
};

express.get("/api/users", async (req, res) => {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const members = await guild.members.fetch();
  const response = members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
  }));

  return res.json(response);
});

express.get("/api/users/:id", async (req, res) => {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(req.params.id);
  const response = {
    id: member.user.id,
    username: member.user.username,
  };

  return res.json(response);
});
