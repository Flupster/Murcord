const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    mumbleId: { type: Number, index: true, unique: true },
    discordId: { type: String, index: true, unique: true },
    username: { type: String, index: true, required: true },
    password: { type: String, default: null },
    lastSeen: {
      mumble: { date: Date },
      discord: { date: Date, message: String },
      game: { date: Date, game: String },
      presence: { date: Date },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", schema);

module.exports = User;
