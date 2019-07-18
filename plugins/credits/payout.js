/*

THIS IS ONLY HERE SO PEOPLE DON'T GET UPSET
THIS IS TO BE REWORKED WITH SQLITE CHANGE
AND IF USERS DON'T GET THERE CREDITS
THEY GET MAD, SO GIVE THEM WHAT THEY WANT

*/

const { mumble, redis } = require("../../bot");

setInterval(giveCredits, 60000);

async function giveCredits() {
  mumble.users.forEach(async u => {
    if (u.idlesecs < 60 && !u.deaf && !u.selfDeaf) {
      const discordID = await redis.get(`discordid:${u.userid}`);
      const exists = await redis.exists(`credits:${discordID}`);

      if (!exists) redis.set(`credits:${discordID}`, 1);
      else redis.incr(`credits:${discordID}`);

      const credits = await redis.get(`credits:${discordID}`);
      console.log(`[CREDITS] ${discordID} now has ${credits} credits`);
    }
  });
}

