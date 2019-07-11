const http = require('http')
const randw = require('random-words')
const Redis = require('ioredis')

const redis = new Redis()

let client
let mumble

exports.use = (c,m) => {
    if (!process.env.DISCORD_GUILD_ID) {
        console.error("[AUTH] env file did not take, did you copy .env.example to .env?")
        process.exit(1)
    }

    client = c
    mumble = m
    client.on('message', m => {
        //If the user is a bot then ignore the message.
        if (m.author.bot) return

        //Assume the DM to the bot is setting their password
        if (m.channel.type === 'dm') {
            this.setUserPassword(m.author, m.content)
            m.author.send(`Okay man, my automated password was way better though :(`)
        }
    })

    client.on('guildMemberUpdate', (old, update) => {
        //Changing nick on discord = changing nick on mumble
        if (old.nickname !== update.nickname) {
            redis.get('mumbleid:' + update.id).then(id => {
                if (id) mumble.renameUser(id, update.nickname || update.user.username)
            })
        }
    })
}

exports.setUserPassword = (user, password) => {
    redis.get('mumbleid:' + user.id).then(id => mumble.kickUser(id, 'Your password was changed so you need to go sorry'))
    redis.set("mumblepass:" + user.id, password)
    console.log("[AUTH] Setting password for", user.username)
}

exports.registerUser = user => {
    const newpassword = randw(3).map(w => w.charAt(0).toUpperCase() + w.slice(1, w.length)).join('')
    redis.incr('mumbleid:pointer').then(i => redis.set('mumbleid:' + user.id, i))
    this.setUserPassword(user, newpassword)
    user.send(`Whaddup Player! Your new password is **${newpassword}** if you wish to change your password then reply to me with the new password!`)
    console.log("[AUTH] Registered user", user.username)
}

exports.login = async data => {
    if (!/([A-Za-z0-9 ]+)#([0-9]{4})/.exec(data.username)) {
        console.error("[AUTH] Invalid username", data.username)
    }

    const ident = data.username.split('#')
    const user = client.guilds.get(process.env.DISCORD_GUILD_ID).members.filter(m => m.user.username.toLowerCase() === ident[0].toLowerCase() && m.user.discriminator === ident[1]).first()

    if (user) {
        const id = await redis.get('mumbleid:' + user.id)
        const password = await redis.get('mumblepass:' + user.id)

        if (!id || !password) this.registerUser(user)
        else if (data.password === password) {
            return {
                id,
                username: user.nickname || user.user.username,
                roles: user.roles.filter(r => r.name !== '@everyone').map(r => r.name)
            }
        }

    } else console.error("[AUTH] Unknown user", data.username)
}

http.createServer((request, response) => {
    let body = '';
    request.on('data', chunk => body += chunk.toString())
    request.on('end', () => {
        const data = JSON.parse(body)
        this.login(data).then(login => {
            if (!login) response.statusCode = 401
            response.end(JSON.stringify(login))

            console.log("[AUTH] Login attempt", login ? 'SUCCESS' : 'FAILURE', data.username)
        })
    })
}).listen(10002, () => console.log("[AUTH] HTTP Server started"))