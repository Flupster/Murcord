const { discord, express, mumble } = require("../bot");

exports.start = async () => {
  console.log("[API] Plugin Loaded");
};

express.get("/api/users", async (req, res) => {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const members = await guild.members.fetch();
  const response = members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
    discriminator: member.user.discriminator,
    avatar: member.user.avatar,
    displayName: member.displayName,
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

express.get("/api/mumble/users", async (req, res) => {
  const musers = await mumble.server.getUsers();
  const data = Array.from(musers.values()).map((u) => ({
    mute: u.mute,
    deaf: u.deaf,
    suppress: u.suppress,
    name: u.name,
    onlinesecs: u.onlinesecs,
    idlesecs: u.idlesecs,
    channel: u.channel,
    ping: { udp: u.udpPing, tcp: u.tcpPing },
  }));

  return res.json(data);
});

express.get("/api/mumble/channels", async (req, res) => {
  const channels = await mumble.server.getChannels();
  return res.json(Array.from(channels.values()));
});
