const Ice = require("ice").Ice;
const murmur = require("./Murmur").Murmur;
const events = require("./events");
const updatedDiff = require("deep-object-diff").updatedDiff;

let Murmur;
let Communicator;

exports.users = new Map();
exports.sessions = new Map();
exports.channels;
exports.server;

exports.connect = async () => {
  const initData = new Ice.InitializationData();
  initData.properties = Ice.createProperties([], initData.properties);
  initData.properties.setProperty("Ice.Default.EncodingVersion", "1.0");
  initData.properties.setProperty("Ice.ImplicitContext", "Shared");
  initData.properties.setProperty(
    "Murmur.Meta",
    `Meta:tcp -h ${process.env.ICE_HOST} -p ${process.env.ICE_PORT}`
  );

  Communicator = Ice.initialize(initData);
  Communicator.getImplicitContext().put("secret", process.env.ICE_PASS);
  Murmur = await murmur.MetaPrx.checkedCast(
    Communicator.propertyToProxy("Murmur.Meta")
  );

  try {
    this.server = await Murmur.getServer(1);

    const users = await this.server.getUsers();

    users.forEach((u) => {
      const user = new MumbleUser(u, this.server);
      this.users.set(u.userid, user);
      this.sessions.set(u.session, user);
    });

    setInterval(this.getUsers, process.env.MUMBLE_REFRESH_INTERVAL || 60000);

    events.emit("ready", this.server);
  } catch (e) {
    console.error(e.toString());
  }
};

exports.setMotd = async (motd, broadcast = true) => {
  await this.server.setConf("welcometext", motd);
  if (broadcast) {
    await this.server.sendWelcomeMessage([...this.sessions.keys()]);
  }
};

exports.getMotd = async () => {
  return await this.server.getConf("welcometext");
};

exports.addContextAction = async (user, action, name, scope) => {
  const { redis } = require("../bot");
  redis.publish(
    "mumble:context",
    JSON.stringify({ session: user.session, action, name, scope })
  );
};

//this can be used to refresh the MumbleUser cache
exports.getUsers = async () => {
  const users = await this.server.getUsers();
  users.forEach((u) => {
    const user = this.users.get(u.userid).update(u);
  });
  return this.users;
};

//add to this.users on new connection
events.on("rawconnect", async (user) => {
  this.server.getState(user.session).then((u) => {
    const user = new MumbleUser(u, this.server);
    this.users.set(u.userid, user);
    this.sessions.set(u.session, user);
    events.emit("connect", user);
  });
});

//remove from this.users on disconnect
events.on("disconnect", (user) => {
  this.users.delete(user.userid);
});

//Mumble psudeo user
function MumbleUser(state, server) {
  Object.keys(state).forEach((k) => (this[k] = state[k]));
  this.state = state;
  this.server = server;

  events.on("userStateChange:" + state.userid, (newState) => {
    this.update(newState);
  });
}

MumbleUser.prototype.update = function (newState) {
  const diff = updatedDiff(this.state, newState);
  for (key in diff) {
    this[key] = this.state[key] = newState[key];
  }
};

MumbleUser.prototype.kick = async function (reason) {
  return this.server.kickUser(this.session, reason || "");
};

MumbleUser.prototype.ban = async function (reason, duration) {
  const ban = new murmur.Ban();
  ban.address = this.address;
  ban.bits = 32;
  ban.name = this.name;
  ban.hash = ""; // no easy way to get hash in nodejs
  ban.reason = reason || "";
  ban.start = +new Date() / 1000; // now
  ban.duration = duration || 0; // ban duration in seconds. 0 is permanent

  this.server.getBans().then((bans) => {
    bans.push(ban);
    this.server.setBans(bans);
    this.kick(reason);
  });
};

MumbleUser.prototype.setNickname = async function (name) {
  this.name = this.state.name = name;
  return this.server.setState(this.state);
};

MumbleUser.prototype.setMute = async function (mute = true) {
  this.mute = this.state.mute = mute;
  return this.server.setState(this.state);
};

MumbleUser.prototype.setComment = async function (comment) {
  this.state.comment = comment;
  return this.server.setState(this.state);
};

MumbleUser.prototype.send = async function (message) {
  return this.server.sendMessage(this.state.session, message || "");
};

MumbleUser.prototype.addRole = async function (role) {
  return this.server.addUserToGroup(0, this.state.session, role);
};

MumbleUser.prototype.removeRole = async function (role) {
  return this.server.removeUserFromGroup(0, this.state.session, role);
};

MumbleUser.prototype.isAdmin = async function () {
  const bit = murmur.PermissionWrite;
  return await this.server.hasPermission(this.session, this.channel, bit);
};

MumbleUser.prototype.move = async function (channel) {
  const channelID = channel instanceof Channel ? channel.id : channel;
  this.channel = this.state.channel = channel;
  return this.server.setState(this.state);
};

// TODO: mimic users but for channels
function Channel(channel) { }
