require('dotenv').config()
const mumble = require('./mumble')
const plugins = require('./plugins')
const Discord = require('discord.js')
const Redis = require('ioredis')
const client = new Discord.Client()
const redis = new Redis()

client.on('ready', () => {
    plugins.load(client, mumble, redis)
    console.log("[DISCORD] Bot connected")
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => {
    console.error('[DISCORD]', e.toString())
    process.exit(1)
})