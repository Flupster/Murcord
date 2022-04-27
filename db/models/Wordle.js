const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: String,
  messageId: String,
  channelId: String,
  day: Number,
  guesses: Number,
  result: [{ type: String }],
  createdTimestamp: Date,
});

schema.index({ day: 1, userId: 1 }, { unique: true });
schema.index({ createdTimestamp: -1 });
schema.index({ userId: 1 });
schema.index({ day: 1 });

const Wordle = mongoose.model("Worlde", schema);

module.exports = Wordle;
