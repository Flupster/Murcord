let discord, mumble, redis
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    discord.on('guildMemberAdd', member => {
        const members = discord.guilds.get(process.env.DISCORD_GUILD_ID).members
        const exists = members.find(u => (u.nickname || u.user.username) === member.user.username)
        if (exists) {
            member.setNickname('! FAKE ! ' + member.user.username)
            member.send('Your name is the same as someone else on the server, you have been renamed, please message an admin if you think this is a mistake.')
        }
    })

    console.log('[FAKEUSERCHECKER] Initialized')
}