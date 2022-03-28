const express = require("express");
const sync = require("./sync");
const { discord, mumble } = require("../../bot");
const User = require("../../db/models/User");

const http = express();
http.use(express.json());

exports.start = () => {
  sync.start();
  http.listen(10003, () => console.log("[HTTPAuth] Loaded"));

  discord.on("guildMemberUpdate", async (old, update) => {
    //Changing nick on discord = changing nick on mumble
    if (old.displayName !== update.displayName) {
      const user = await User.findOne({ discordId: update.id });
      mumble.users.get(user.mumbleId).setNickname(update.displayName);
    }
  });
};

async function login(username, password) {
  const user = await User.findOne({
    $or: [{ username }, { discordId: username }],
    $and: [{ password }],
  });

  if (!user || !user.password) return;

  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const duser = await guild.members.fetch(user.discordId);
  const roles = duser.roles.cache
    .filter((r) => r.name !== "@everyone")
    .map((r) => r.name);

  return { id: user.mumbleId, name: duser.displayName, roles };
}

http.get("/", (req, res) => {
  res.status(201).send();
});

http.post("/login", (req, res) => {
  login(req.body.username, req.body.password)
    .then((success) => {
      if (success) res.send(success);
      else res.status(401).send();
    })
    .catch((ex) => {
      console.log("HTTPAuth failed with:", ex);
      res.status(503).send();
    });
});
