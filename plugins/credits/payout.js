/*

THIS IS ONLY HERE SO PEOPLE DON'T GET UPSET
THIS IS TO BE REWORKED WITH SQLITE CHANGE
AND IF USERS DON'T GET THERE CREDITS
THEY GET MAD, SO GIVE THEM WHAT THEY WANT

*/
const { mumble, redis } = require("../../bot");
const setComments = process.env.CREDITS_COMMENT == "1";

if (setComments) {
  //Set existing users comment
  mumble.users.forEach(async u => {
    const discordID = await redis.get(`discordid:${u.userid}`);
    const credits = await redis.get(`credits:${discordID}`);
    u.setComment("Credits: " + credits);
  });

  //Set comment on connect
  mumble.on("connect", async user => {
    const discordID = await redis.get(`discordid:${user.userid}`);
    const credits = await redis.get(`credits:${discordID}`);
    user.setComment("Credits: " + credits);
  });
}

setInterval(giveCredits, 60000);

async function giveCredits() {
  mumble.users.forEach(async u => {
    if (u.idlesecs < 60 && !u.deaf && !u.selfDeaf && !u.suppress) {
      const discordID = await redis.get(`discordid:${u.userid}`);
      const exists = await redis.exists(`credits:${discordID}`);

      if (!exists) redis.set(`credits:${discordID}`, 1);
      else redis.incr(`credits:${discordID}`);

      const credits = await redis.get(`credits:${discordID}`);
      if (setComments) u.setComment("Credits: " + credits);
      console.log(`[CREDITS] ${discordID} now has ${credits} credits`);
    }
  });
}
