const { mumble } = require("../bot");

exports.start = () => {
  if (!process.env.AFK_CHANNEL_ID) {
    return console.error("AFK plugin is not set up correctly");
  }

  const afkChannelID = parseInt(process.env.AFK_CHANNEL_ID);
  const afkTimeout = process.env.AFK_TIMEOUT;
  const afkDeafTimeout = process.env.AFK_DEAF_TIMEOUT;

  setInterval(async () => {
    mumble.users.forEach(user => {
      if (user.channel === afkChannelID) return;
      if (user.selfDeaf && user.idlesecs > afkDeafTimeout) {
        return user.move(afkChannelID);
      }
      if (user.idlesecs > afkTimeout) {
        return user.move(afkChannelID);
      }
    });
  }, 60000);

  console.log('AFK plugin loaded')
};
