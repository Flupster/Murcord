const { mumble, discord } = require("../bot");

exports.start = async () => {
  if (!process.env.SPY_CHANNEL_ID) {
    return console.error("Spy plugin is not set up correctly");
  }

  const channelID = process.env.SPY_CHANNEL_ID;
  const messageID = process.env.SPY_MESSAGE_ID;

  const channel = await discord.channels.fetch(channelID);

  if (!messageID) {
    channel.send("Setting up!").then(msg => {
      message = msg;
      console.log("Change env SPY_MESSAGE_ID to", msg.id);
    });
  } else {
    channel
      .messages
      .fetch(process.env.SPY_MESSAGE_ID)
      .then(msg => (message = msg));
  }

  setInterval(() => {
    const users = [...mumble.users.values()];
    const active = users
      .filter(u => !u.mute && !u.selfMute && !u.suppress)
      .map(u => u.name);
    message.edit("Active Users```\r" + active.join("\r") + "\r```");
  }, 30000);
  
  console.log("[Spy] plugin loaded");
};
