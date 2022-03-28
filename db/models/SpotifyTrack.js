const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    discordId: { type: String, index: true },
    songId: { type: String, index: true },
    songName: { type: String },
    songArtist: { type: String },
    songAlbum: { type: String },
  },
  { timestamps: true }
);

const SpotifyTrack = mongoose.model("SpotifyTrack", schema);

module.exports = SpotifyTrack;
