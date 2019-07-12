let discord, mumble, redis
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    if (!process.env.AFK_CHANNEL_ID) {
        console.error('[AFK] Env is not set up correctly, please check .env.example')
    } else {
        setInterval(moveAFK, 60000);
        console.log('[AFK] Initialized')
    }
}

async function moveAFK() {
    const users = await mumble.getUsers()
    users.forEach(user => {
        if(user.channel === parseInt(process.env.AFK_CHANNEL_ID)) return
        if (user.selfDeaf && user.idlesecs > process.env.AFK_DEAF_TIMEOUT || user.idlesecs > process.env.AFK_TIMEOUT) {
            console.log('[AFK] Moving user to AFK', user.name)
            mumble.moveUser(user.userid, process.env.AFK_CHANNEL_ID)
        }
    })
}