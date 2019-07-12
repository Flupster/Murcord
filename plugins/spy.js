let discord, mumble, redis, message
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    if (!process.env.SPY_CHANNEL_ID) {
        console.error('[SPY] Env is not set up correctly, please check .env.example')
    } else {
        const channel = discord.guilds.get(process.env.DISCORD_GUILD_ID).channels.get(process.env.SPY_CHANNEL_ID)
        if (!process.env.SPY_MESSAGE_ID) {
            channel.send('Standby!').then(msg => {
                message = msg
                msg.edit('CHANGE .ENV SPY_MESSAGE_ID TO: ' + msg.id)
            })
        } else {
            channel.fetchMessage(process.env.SPY_MESSAGE_ID).then(msg => message = msg)
        }

        setInterval(updateMessage, 5000)
        console.log('[SPY] Initialized')
    }
}

async function updateMessage() {
    console.log('[SPY] Updating server spy message')
    const users = await mumble.getUsers()
    message.edit('Active Users```\r' + users.filter(u => !u.deaf && !u.selfDeaf && !u.mute && !u.selfMute).map(u => u.name).join('\r') + '\r```')
}