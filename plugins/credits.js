let discord, mumble, redis
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    setInterval(giveCredits, 60000)
    discord.on('message', async msg => {
        if (msg.author.bot) return

        if (msg.content === '!prices') {
            msg.reply(`\`\`\`
+--------+-------+---------------------------------------+
|  Name  | Price |              Description              |
+--------+-------+---------------------------------------+
| rename |   1   | Sets a nickname on mumble and discord |
+--------+-------+---------------------------------------+
|        |       |                                       |
+--------+-------+---------------------------------------+
|        |       |                                       |
+--------+-------+---------------------------------------+
            \`\`\``)
        }
        if (msg.content === '!credits') {
            const credits = await redis.get(`credits:${msg.author.id}`)
            msg.reply('You have **' + credits || 'no' + '** credits')
        }

        if (msg.content.startsWith('!rename')) {
            const credits = await redis.get(`credits:${msg.author.id}`)
            if (!credits || parseInt(credits) < 1) {
                return msg.reply(`you only have **${credits}** credits`)
            }

            const user = discord.guilds.get(process.env.DISCORD_GUILD_ID).members.filter(m => m.user.id === msg.author.id).first()
            if (user) {
                await user.setNickname(msg.content.replace('!rename ', ''))
                await redis.decr(`credits:${msg.author.id}`)
                msg.reply(`you now have **${newCredits}** credits`)
            }

        }
    })

    console.log('[CREDITS] Initialized')
}

async function giveCredits() {
    const users = await mumble.getUsers()

    users.forEach(async user => {
        if (user.idlesecs < 60 && !user.mute && !user.deaf && !user.selfMute && !user.selfDeaf) {
            const discordID = await redis.get(`discordid:${user.userid}`)

            const exists = await redis.exists(`credits:${discordID}`)
            if (!exists) redis.set(`credits:${discordID}`, 1)
            else redis.incr(`credits:${discordID}`)

            const credits = await redis.get(`credits:${discordID}`)
            console.log(`[CREDITS] ${discordID} now has ${credits} credits`)
        }
    })
}