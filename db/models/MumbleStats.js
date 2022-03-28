const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    mumbleId: { type: Number, index: true, unique: true },
    lastSeen: { type: Date, default: null },
    connects: { type: Number, default: 0 },
    onlineSecs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MumbleStats = mongoose.model("MumbleStats", schema);

module.exports = MumbleStats;
