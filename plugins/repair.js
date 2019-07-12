let discord, mumble, redis
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    redis.keys('mumbleid:*').then(keys => {
        console.log("[REPAIR] User count:", keys.length - 1)

        keys.forEach(async key => {
            if (key === 'mumbleid:pointer') return
            const discordID = key.split(':').pop()
            const mumbleID = await redis.get(key)
            if (!await redis.exists('discordid:' + mumbleID)) {
                console.log("[REPAIR] There is no matching mumble ID for the discord user", discordID)
                redis.set('discordid:' + mumbleID, discordID)
            }
        })
    })
}