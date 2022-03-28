const { discord } = require("../bot");

exports.start = () => {
  discord.on("guildMemberAdd", async (member) => {
    const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const members = await guild.members.fetch();
    const exists = members.find((u) => {
      if (u.user.id === member.user.id) return false;
      return (u.nickname || u.user.username) === member.user.username;
    });

    if (exists) {
      console.log("Imposter joined", member.user.username, member.user.id);

      member.setNickname("! IMPOSTER ! " + member.user.username);
      member.send(
        "Your name is the same as someone else on the server, you have been renamed, please message an admin if you think this is a mistake."
      );
    }
  });

  console.log("[Imposter] plugin loaded");
};
