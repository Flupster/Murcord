const Ice = require('ice').Ice
const murmur = require('./Murmur.js').Murmur

exports.users
let Murmur
let Communicator
let Servers

exports.connect = async () => {
    const initData = new Ice.InitializationData()
    initData.properties = Ice.createProperties([], initData.properties)
    initData.properties.setProperty('Ice.Default.EncodingVersion', '1.0')
    initData.properties.setProperty('Ice.ImplicitContext', 'Shared')
    initData.properties.setProperty('Murmur.Meta', `Meta:tcp -h ${process.env.ICE_HOST} -p ${process.env.ICE_PORT}`)

    Communicator = Ice.initialize(initData);
    Communicator.getImplicitContext().put("secret", process.env.ICE_PASS)
    Murmur = await murmur.MetaPrx.checkedCast(Communicator.propertyToProxy('Murmur.Meta'))

    try {
        Servers = await Murmur.getAllServers()
        for (let i = 0; i < Servers.length; i++) {
            this.users = await Servers[i].getUsers()
            this.events.emit('ready', Servers[i])
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

exports.kickUser = async (userid, reason = "") => {
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

exports.muteUser = async (userid, mute) => {
    const user = await this.getUser(userid)
    if (user && user.mute != mute) {
        user.mute = mute
        Servers[user.server].setState(user)
    }
}

//ServerCallback and ServerAuthenticator only work in python
//Therefor we publish to a redis channel and subscribe here
//The python script will run as a child and is managed by auth.js and auth.py
const Emitter = require('events').EventEmitter
exports.events = new Emitter()

const Redis = require('ioredis')
const redis = new Redis()

redis.subscribe("mumble:event")
redis.on("message", (channel, message) => {
    const data = JSON.parse(message)
    const type = data.type
    delete data.type

    if (type === 'change') {
        data.new = data.state
        data.old = this.users.get(data.state.session)
        data.diff = Object.keys(data.new).filter(k => {
            const diffKeys = ['mute', 'deaf', 'suppress', 'prioritySpeaker', 'selfMute', 'selfDeaf', 'recording', 'channel', 'comment', 'name']
            return diffKeys.includes(k) && data.new[k] !== data.old[k]
        })

        //emit an event for state changes example: mumble.on('userPrioritySpeakerChange') and mumble.on('userRecordingChange')
        //arguments are: 1. current user state, 2. new key value, 3. old key value
        data.diff.forEach(key => {
            this.events.emit(
                'user' + key.charAt(0).toUpperCase() + key.slice(1) + 'Change',
                data.new, data.new[key], data.old[key]
            )
        })

        this.users.set(data.state.session, data.state)
        delete data.state
    }

    this.events.emit(type, ...Object.keys(data).map(key => data[key]))
})

this.events.on('connect', user => this.users.set(user.session, user))
this.events.on('disconnect', user => this.users.delete(user.session))
