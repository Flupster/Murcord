const { discord, mumble, redis } = require("../../bot");

discord.on("message", async msg => {
  if (msg.content.startsWith("!credits") && !msg.author.bot) {
    const credits = await redis.get(`credits:${msg.author.id}`);
    msg.reply(`you have **${credits || 0}** credits`);
  }
});

mumble.on("message", async (author, msg) => {
  if (msg.text.startsWith("!credits")) {
    const discordID = await redis.get(`discordid:${author.userid}`);
    const credits = await redis.get(`credits:${discordID}`);
    mumble.users
      .get(author.userid)
      .send(`you have <strong>${credits || 0}</strong> credits`);
  }
});
