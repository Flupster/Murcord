const { mumble, discord } = require("../bot");

exports.start = () => {
  updatePresence();
  setInterval(updatePresence, 60000);
  mumble.on("connect", updatePresence);
  mumble.on("disconnect", updatePresence);

  console.log("[Presence] plugin loaded");
};

async function updatePresence() {
  const users = [...mumble.users.values()];
  const active = users.filter((u) => !u.mute && !u.selfMute && !u.suppress);

  discord.user.setActivity(`Mumble: ${active.length}`, { type: 3 });
}
