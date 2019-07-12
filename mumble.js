const Ice = require('ice').Ice
const murmur = require('./Murmur').Murmur

let Murmur
let Communicator
let Servers

exports.Connect = async () => {
    const initData = new Ice.InitializationData()
    initData.properties = Ice.createProperties([], initData.properties)
    initData.properties.setProperty('Ice.Default.EncodingVersion', '1.0')
    initData.properties.setProperty('Ice.ImplicitContext', 'Shared')
    initData.properties.setProperty('Murmur.Meta', `Meta:tcp -h ${process.env.ICE_HOST} -p ${process.env.ICE_PORT}`)
    //initData.properties.setProperty('Murmur.ServerAuthenticator.Endpoints', 'tcp -h 127.0.0.1 -p 10001')

    Communicator = Ice.initialize(initData);
    Communicator.getImplicitContext().put("secret", process.env.ICE_PASS)
    Murmur = await murmur.MetaPrx.checkedCast(Communicator.propertyToProxy('Murmur.Meta'))

    try {
        Servers = await Murmur.getAllServers()
        for (let i = 0; i < Servers.length; i++) {
            const name = await Servers[i].getConf('name') || 'NO_NAME'
            console.log("[MUMBLE] Server available:", name)
        }
    } catch (e) {
        console.error(e.toString())
    }
}

exports.getUsers = async () => {
    const allUsers = []
    for (let i = 0; i < Servers.length; i++) {
        const users = await Servers[i].getUsers();
        [...users].forEach(u => {
            u[1].server = i
            allUsers.push(u[1])
        })
    }
    return allUsers
}

exports.getUser = async (userid) => {
    const users = await this.getUsers()
    return users.find(u => u.userid === parseInt(userid))
}

exports.renameUser = async (userid, name) => {
    const user = await this.getUser(userid)
    if (user) {
        user.name = name
        await Servers[user.server].setState(user)
    }
}

exports.kickUser = async (userid, reason) => {
    const user = await this.getUser(userid)
    if (user) await Servers[user.server].kickUser(user.session, reason)
}

exports.sendMessage = async (userid, message) => {
    const user = await this.getUser(userid)
    if (user) await Servers[user.server].sendMessage(user.session, message)
}

exports.addChannel = async (name, parent = 0, server = 0) => {
    return await Servers[server].addChannel(name, parent)
}

exports.moveUser = async (userid, channelid) => {
    const user = await this.getUser(userid)
    if (user) {
        user.channel = channelid
        Servers[user.server].setState(user)
    }
}

// exports.SetUpAuthenticators = async () => {
//     try {
//         //This should work?? but error: object adapter endpoints not supported
//         const adapter = await Communicator.createObjectAdapter('Murmur.ServerAuthenticator')
//         adapter.activate()
//         const server = await Murmur.getServer(1)
//         const identity = Communicator.stringToIdentity("mainserver")
//         const auth = new MurmurAuthenticatorI(server)
//         adapter.add(auth, identity)
//         await server.setAuthenticator(
//             murmur.ServerAuthenticatorPrx.uncheckedCast(adapter.createProxy(identity))
//         )
//     } catch (e) {
//         console.error(e.toString())
//     }
// }

// //this is all guess work...
// class MurmurAuthenticatorI extends murmur.ServerAuthenticator {
//     authenticate(name, pw, certs, certHash, certStrong, _ctx) {
//         console.log("Login attempt from", name, "with password", pw)
//     }
//     idToName(self, uid, _ctx = None) {}
//     idToTexture(self, uid, _ctx = None) {
//         return []
//     }
// }

this.Connect()