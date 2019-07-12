require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()
const mumble = require('./mumble')
const Redis = require('ioredis')
const redis = new Redis()
const plugins = require('./plugins')

client.on('ready', () => {
    plugins.load(client, mumble, redis)
    console.log("[DISCORD] Bot connected")
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => {
    console.error('[DISCORD]', e.toString())
    process.exit(1)
})