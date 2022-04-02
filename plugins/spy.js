const { mumble, discord } = require("../bot");
const { table, getBorderCharacters } = require("table");

exports.start = async () => {
  if (!process.env.SPY_CHANNEL_ID) {
    return console.error("Spy plugin is not set up correctly");
  }

  const channelID = process.env.SPY_CHANNEL_ID;
  const messageID = process.env.SPY_MESSAGE_ID;

  const channel = await discord.channels.fetch(channelID);
  const message = await channel.messages.fetch(messageID);

  updateMessage(message);
  setInterval(() => updateMessage(message), 30000);

  console.log("[Spy] plugin loaded");
};

function updateMessage(message) {
  const users = [...mumble.users.values()];
  const active = users
    .filter((u) => !u.mute && !u.selfMute && !u.suppress)
    .map((u) => ({
      name: String(u.name.match(/[a-zA-Z0-9\(\) ]+/g).join("")).trim(),
      inactive: u.idlesecs < 60 ? "0m" : Math.floor(u.idlesecs / 60) + "m",
    }));

  const tableData = active.map((u) => [u.name, u.inactive]);

  if (tableData.length === 0) {
    return message.edit("Active Users: No one...");
  }

  const payload = table(tableData, {
    border: getBorderCharacters("norc"),
    columns: {
      0: { alignment: "right" },
      1: { width: 5, alignment: "left" },
    },
  });

  message.edit("Active Users```\r" + payload + "\r```");
}
