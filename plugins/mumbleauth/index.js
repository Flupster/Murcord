const express = require("express");
const randw = require("random-words");
const sync = require("./sync");
const { knex, discord, mumble } = require("../../bot");
const { User } = require("../../models");
const http = express();
http.use(express.json());

exports.start = () => {
  sync.start();
  http.listen(10003, () => console.log("HTTPAuth started"));

  discord.on("message", m => {
    if (m.author.bot) return;
    if (m.content.startsWith("!")) return;
    if (m.channel.type === "dm") {
      knex("users")
        .where({ discord_id: m.author.id })
        .first()
        .then(user => {
          setUserPassword(user.id, m.content);
          m.author.send("Your new password was set");
        });
    }
  });

  discord.on("guildMemberUpdate", async (old, update) => {
    //Changing nick on discord = changing nick on mumble
    if (old.displayName !== update.displayName) {
      const user = await User.query()
        .where({ discord_id: update.id })
        .first();

      user.mumble().setNickname(update.displayName);
    }
  });
};

async function setUserPassword(id, password) {
  await knex("users")
    .where({ id })
    .update({ password });

  //If they're on mumble kick them
  const muser = mumble.users.get(id);
  if (muser) muser.kick("Your password was changed");
}

async function login(username, password) {
  const user = await knex("users")
    .where(function() {
      this.where("discord_id", username).orWhere("username", username);
    })
    .andWhere(function() {
      this.where("password", password).orWhereNull("password");
    })
    .first();

  if (!user) return;

  if (!user.password) {
    const newpassword = randw(3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1, w.length))
      .join("");

    setUserPassword(user.id, newpassword);
    discord.users
      .fetch(user.discord_id)
      .then(user => {
          user.send(`Hey! You should be presented with a password dialogue... Here's your password! \`\`\`${newpassword}\`\`\``);
       });
  } else {
    const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const duser = await guild.members.fetch(user.discord_id);
    const roles = duser.roles.cache.filter(r => r.name !== "@everyone").map(r => r.name);

    return { id: user.id, name: duser.displayName, roles };
  }
}

http.post("/login", (req, res) => {
  login(req.body.username, req.body.password)
    .then(success => {
      if (success) res.send(success);
      else res.status(401).send();
    })
    .catch(ex => {
      console.log("HTTPAuth failed with:", ex);
      res.status(503).send();
    });
});
