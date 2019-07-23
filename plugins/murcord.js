const { discord, mumble, redis } = require("../bot");
const http = require("http");
const randw = require("random-words");

exports.start = () => {
  if (!process.env.DISCORD_GUILD_ID) {
    return console.error("Murcord plugin is not set up correctly");
  }

  discord.on("message", m => {
    //If the user is a bot then ignore the message.
    if (m.author.bot) return;

    //If this is a command then let the plugins deal with that
    if (m.content.startsWith("!")) return;

    //Assume the DM to the bot is setting their password
    if (m.channel.type === "dm") {
      this.setUserPassword(m.author, m.content);
      m.author.send(`Okay man, my automated password was way better though :(`);
    }
  });

  discord.on("guildMemberUpdate", (old, update) => {
    //Changing nick on discord = changing nick on mumble
    if (old.nickname !== update.nickname) {
      redis.get("mumbleid:" + update.id).then(id => {
        if (id) {
          const user = mumble.users.get(parseInt(id));
          if (user) user.setNickname(update.nickname || update.user.username);
        }
      });
    }
  });

  console.log("Murcord plugin loaded");
};

// TODO: seperate from murcord plugin
// TODO: rename murcord plugin to something more authy

exports.setUserPassword = async (user, password) => {
  const userID = await redis.get("mumbleid:" + user.id);
  if ((mumbleuser = mumble.users.get(parseInt(userID)))) {
    mumbleuser.kick("Your password was changed so you got to go.");
  }

  redis.set("mumblepass:" + user.id, password);
  console.log("Murcord setting password for", user.id);
};

exports.registerUser = user => {
  const newpassword = randw(3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1, w.length))
    .join("");

  redis.incr("mumbleid:pointer").then(i => {
    redis.set("mumbleid:" + user.id, i);
    redis.set("discordid:" + i, user.id);
  });

  this.setUserPassword(user, newpassword);
  user.send(
    `Whaddup Player! Your new password is **${newpassword}** if you wish to change your password then reply to me with the new password!`
  );

  console.log("Murcord registered user", user.id, user.user.username);
};

exports.login = async data => {
  if (
    !(
      /([A-Za-z0-9 ]+)#([0-9]{4})/.exec(data.username) ||
      /^([0-9]+)/.exec(data.username)
    )
  ) {
    console.error("Murcord invalid username", data.username);
    return;
  }

  const guild = discord.guilds.get(process.env.DISCORD_GUILD_ID);
  let user;

  if (/^([0-9]+)/.exec(data.username)) {
    user = guild.members.get(data.username);
  } else {
    const ident = data.username.split("#");
    user = guild.members
      .filter(
        m =>
          m.user.username.toLowerCase() === ident[0].toLowerCase() &&
          m.user.discriminator === ident[1]
      )
      .first();
  }

  if (user) {
    const id = await redis.get("mumbleid:" + user.id);
    const password = await redis.get("mumblepass:" + user.id);

    if (!id || !password) {
      this.registerUser(user);
    } else if (data.password === password) {
      //Login check passed, set up mumble account
      let username = user.nickname || user.user.username;
      if (user.hasPermission("ADMINISTRATOR")) {
        username = username + " " + process.env.MUMBLE_ADMIN_TITLE;
      } else {
        username.replace(
          /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ""
        );
      }

      const roles = user.roles
        .filter(r => r.name !== "@everyone")
        .map(r => r.name);

      return {
        id,
        username,
        roles
      };
    }
  } else {
    console.error("Murcord Unknown user", data.username);
  }
};

http
  .createServer((request, response) => {
    let body = "";
    request.on("data", chunk => (body += chunk.toString()));
    request.on("end", () => {
      const data = JSON.parse(body);
      this.login(data).then(login => {
        if (!login) response.statusCode = 401;
        response.end(JSON.stringify(login));

        console.log(
          "Murcord Login attempt",
          login ? "SUCCESS" : "FAILURE",
          data.username
        );
      });
    });
  })
  .listen(10002, () => console.log("Murcord HTTP Server started"));
