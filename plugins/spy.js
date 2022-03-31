const { mumble, discord } = require("../bot");
const humanizeDuration = require("humanize-duration");
const { table, getBorderCharacters } = require("table");

const regemoji =
  /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;

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
      name: u.name.replace(regemoji, "").trim(),
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
