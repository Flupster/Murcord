require("dotenv").config();
const mumble = require("./mumble");
const plugins = require("./plugins");
const Discord = require("discord.js");
const Redis = require("ioredis");
const knex = require("knex")(require("./knexfile")[process.env.NODE_ENV]);
const client = new Discord.Client();
const redis = new Redis();

exports.discord = client;
exports.mumble = mumble;
exports.redis = redis;
exports.knex = knex;

client.on("ready", () => {
  plugins.load();
  client.guilds.forEach(g => g.fetchMembers());
  console.log("Discord bot connected");
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => {
  console.error("Discord Error:", e.toString());
  process.exit(1);
});
