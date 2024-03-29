require("dotenv").config();
const mumble = require("./mumble");
const plugins = require("./plugins");
const Discord = require("discord.js");
const Redis = require("ioredis");
const logger = require("./log");
const express = require("./web");
const mongoose = require("./db");
const log = logger.getLogger("bot");

const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    "GUILD_PRESENCES",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGE_REACTIONS",
  ],
});

const redis = new Redis();

exports.discord = client;
exports.mumble = mumble;
exports.redis = redis;
exports.express = express;
exports.logger = logger;

client.on("ready", async () => {
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const members = await guild.members.fetch();
  plugins.load();
  log.info("Discord Connected");
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((e) => {
  log.error("Discord Error:", e.toString());
  process.exit(1);
});
