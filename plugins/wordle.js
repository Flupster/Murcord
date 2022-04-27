const { discord, express } = require("../bot");
const Wordle = require("../db/models/Wordle");

exports.start = () => {
  console.log("[Wordle] plugin loaded");
};

discord.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const match = message.content.match(/^Wordle ([\d]+) \d\/\d\*?\n\n(.*)$/s);
  if (!match) return;

  const result = match[2].replace(/⬜/g, "⬛").split("\n");
  const data = {
    userId: message.author.id,
    messageId: message.id,
    channelId: message.channelId,
    day: parseInt(match[1]),
    guesses: result.length,
    result: result,
    createdTimestamp: new Date(message.createdTimestamp),
  };

  Wordle.create(data).catch((e) =>
    console.error({ Plugin: "Wordle", Error: e })
  );
});

express.get("/api/wordle/day", async (req, res) => {
  const last = await Wordle.findOne({}).sort({ createdTimestamp: -1 });
  res.json(last.day);
});

express.get("/api/wordle/day/:day", async (req, res) => {
  const day = parseInt(req.params.day);
  if (isNaN(day)) return res.status(400).json({ error: "Invalid day" });
  const wordles = await Wordle.find({ day });
  res.json(wordles);
});

express.get("/api/wordle/user/:userId", async (req, res) => {
  const wordles = await Wordle.find({ userId: req.params.userId });
  res.json(wordles);
});
