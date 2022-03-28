const { mumble } = require("../bot");

exports.start = () => {
  if (!process.env.AFK_CHANNEL_ID) {
    return console.error("[AFK] plugin is not set up correctly");
  }

  const afkChannelID = parseInt(process.env.AFK_CHANNEL_ID);
  const afkTimeout = process.env.AFK_TIMEOUT;
  const afkDeafTimeout = process.env.AFK_DEAF_TIMEOUT;

  setInterval(async () => {
    console.log("[AFK] Checking for AFK'ers");
    
    mumble.users.forEach((user) => {
      if (user.channel === afkChannelID) return;
      if (user.selfDeaf && user.idlesecs > afkDeafTimeout) {
        console.log(`[AFK] Moving ${user.name} to AFK (deaf)`);
        return user.move(afkChannelID);
      }
      if (user.idlesecs > afkTimeout) {
        console.log(`[AFK] Moving ${user.name} to AFK (timeout)`);
        return user.move(afkChannelID);
      }
    });
  }, 60000);

  console.log("[AFK] plugin loaded");
};
