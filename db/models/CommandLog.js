const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    discordId: { type: String, index: true },
    channelId: { type: String },
    commandName: { type: String },
    commandArgs: { type: Array },
  },
  { timestamps: true }
);

// schema.static.discord = function (discordId) {
//     return discord.fetchUser(discordId);
// };

const CommandLog = mongoose.model("CommandLog", schema);

module.exports = CommandLog;
