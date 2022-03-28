const { redis, discord, express } = require("../bot");
const SpotifyTrack = require("../db/models/SpotifyTrack");

exports.start = () => {
  discord.on("presenceUpdate", async (_, presence) => {
    // Find spotify Activity
    const activity = presence.activities.find((a) => a.id === "spotify:1");
    if (!activity) return;

    // Check if last played song is same as current song
    const userPreviousSong = await redis.get("spotify:last:" + presence.userId);
    if (userPreviousSong === activity.syncId) return;
    redis.set("spotify:last:" + presence.userId, activity.syncId);

    SpotifyTrack.create({
      discordId: presence.userId,
      songId: activity.syncId,
      songName: activity.details,
      songArtist: activity.state,
      songAlbum: activity.assets?.largeText,
    });
  });

  console.log("[Spotify Track] Loaded");
};

express.get("/api/spotifytracks", async (req, res) => {
  const tracks = await SpotifyTrack.find().sort({ createdAt: -1 });
  res.json(
    tracks.map((t) => ({
      discordId: t.discordId,
      songId: t.songId,
      songName: t.songName,
      songArtist: t.songArtist,
      songAlbum: t.songAlbum,
      startedAt: t.createdAt,
    }))
  );
});

express.get("/api/spotifytracks/:id", async (req, res) => {
  const user = await discord.users.fetch(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const tracks = await SpotifyTrack.find({ discordId: req.params.id }).sort({
    createdAt: -1,
  });

  const playHistory = tracks.map((t) => ({
    songId: t.songId,
    songName: t.songName,
    songArtist: t.songArtist,
    songAlbum: t.songAlbum,
    startedAt: t.createdAt,
  }));

  res.json({ user, playHistory });
});
