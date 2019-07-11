require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()
const murcord = require('./auth')
const mumble = require('./mumble')

client.on('ready', () => {
    murcord.use(client, mumble)
    console.log("[DISCORD] Bot connected")
})

client.on('message', msg => {
    if (msg.author.bot) return
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => {
    console.error('[DISCORD]', e.toString())
    process.exit(1)
})