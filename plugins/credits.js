let discord, mumble, redis
exports.use = (d, m, r) => [discord, mumble, redis] = [d, m, r]

exports.run = () => {
    setInterval(giveCredits, 60000)
    setInterval(muteUsers, 5000)
    discord.on('message', async msg => {
        if (msg.author.bot) return

        if (msg.content === '!prices') {
            msg.reply(`\`\`\`
!credits        credits:0
!create-channel BIG FLOPPY CHANNEL NAME HERE credits:60
!mute Mumble User for ${process.env.MUTE_TIME} minutes. credits: 100 
!unmute Mumble User     credits: 50
!kick-madcat credits:30\`\`\``)
        }

        if (msg.content.startsWith('!credits')) msgCredits(msg)
        //if (msg.content.startsWith('!rename')) msgRenameUser(msg)
        if (msg.content.startsWith('!create-channel')) msgCreateChannel(msg)
        if (msg.content.startsWith('!mute ')) msgMute(msg)
        if (msg.content.startsWith('!unmute ')) msgUnMute(msg)
        if (msg.content.startsWith('!kick-madcat')) msgKickMadcat(msg)
    })

    console.log('[CREDITS] Initialized')
}

async function msgKickMadcat(msg){
    const credits = await userCredits(msg.author.id)
    if (credits < 30) return msg.reply(`You only have **${credits}** credits and you need at least 5`)

    const madcat = await mumble.getUser(12)
    if(madcat){
        mumble.kickUser(12)
        changeCredits(msg.author.id, -30)
        msg.reply("Fuck you madcat")
    }else{
        msg.reply("Madcat isn't on mumble at the moment, please come back later.... please")
    }
   
    console.log(`[CREDITS] User:${msg.author.id} kicked madcat`)
}

async function msgMute(msg) {
    const credits = await userCredits(msg.author.id)
    if (credits < 100) return msg.reply(`You do not have enough credits to perform that command!`)
    const users = await mumble.getUsers()
    const name = msg.content.replace("!mute ","");
    if(users) {
        users.forEach(async (user) => {
            if(user.name == name) {
                changeCredits(msg.author.id, -100)
                const discordID = await redis.get(`discordid:${user.userid}`)
                const discordUser = discord.guilds.get(process.env.DISCORD_GUILD_ID).members.filter(m => m.id === discordID).first()
                if (discordUser.hasPermission('ADMINISTRATOR')) {
                    console.log(`[MUTE] ${msg.author.username} attempted to mute an administrator!`);
                    return msg.reply(`Fuck off retard`);
                }
                else {
                    console.log(`[MUTE] Adding mute for user: ${name}`);
                    mumble.muteUser(user.userid, true);
                    redis.set(`mute:${user.userid}`, Math.floor(new Date() / 1000) + (process.env.MUTE_TIME * 60))
                    return msg.reply(`User **${name}** muted for ${process.env.MUTE_TIME} minutes!`);
                }
            }
        });
    }
}

async function msgUnMute(msg) {
    const credits = await userCredits(msg.author.id)
    if (credits < 50) return msg.reply(`You do not have enough credits to perform that command!`)
    const users = await mumble.getUsers()
    const name = msg.content.replace("!unmute ","");
    if(users) {
        users.forEach(async (user) => {
            if(user.name == name && user.mute) {
                const exists = await redis.exists(`mute:${user.userid}`)
                if(exists) {
                    changeCredits(msg.author.id, -50)
                    console.log(`[MUTE] Removing mute for user: ${name}`);
                    mumble.muteUser(user.userid, false);
                    redis.del(`mute:${user.userid}`);
                    return msg.reply(`User **${name}** has been unmuted!`);
                }
            }
        });
    }
}

async function muteUsers() {
    var muteStream = redis.scanStream({match: "mute:*", count: 100});
    muteStream.on("data", async function(keys) {
        const currentTime = Math.floor(new Date() / 1000);
        for(var i = 0, len = keys.length; i < len; i++) {
            const endTime = await redis.get(keys[i]);
            const uid = keys[i].split(":")[1];
            const diffTime = endTime - currentTime;

            if(diffTime <= 0) {
                console.log(`[MUTE] Unmuting: ${uid}`);
                redis.del(keys[i]);
                mumble.muteUser(uid, false);
            }
            else {
                //console.log(`[MUTE] Muting: ${uid} || ${diffTime} seconds remaining.`);
                mumble.muteUser(uid, true);
            }
        }
    });
}

function userCredits(userID) {
    return redis.get(`credits:${userID}`)
}

function changeCredits(userID, amount) {
    userCredits(userID).then(credits => redis.set(`credits:${userID}`, parseInt(credits) + amount))
}

async function msgCreateChannel(msg) {
    const credits = await userCredits(msg.author.id)
    if (credits < 60) return msg.reply(`You only have **${credits}** credits and you need at least 60`)

    const name = msg.content.replace('!create-channel ', '')
    mumble.addChannel(name)
    changeCredits(msg.author.id, -60)
    msg.reply("The mumble channel has been created!")

    console.log(`[CREDITS] User:${msg.author.id} created channel: ${name}`)
}

async function msgCredits(msg) {
    const credits = await redis.get(`credits:${msg.author.id}`) || 0
    msg.reply(`You have **${credits}** credits`)
}

async function msgRenameUser(msg) {
    const credits = await userCredits(msg.author.id)
    if (credits < 60) return msg.reply(`You only have **${credits}** credits and you need at least 60`)

    const user = discord.guilds.get(process.env.DISCORD_GUILD_ID).members.filter(m => m.user.id === msg.author.id).first()
    if (user) {
        await user.setNickname(msg.content.replace('!rename ', ''))
        changeCredits(msg.author.id, -60)
        msg.reply('Enjoy your new name!')
    }
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
