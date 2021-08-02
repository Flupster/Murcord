module.exports = {
  name: "ping",
  description: "Get Latency to Bot",
  options: [],
  async execute(interaction) {
    const latency = +new Date() - interaction.createdTimestamp;
    return interaction.reply(`Response time: ${latency}ms`);
  },
};
