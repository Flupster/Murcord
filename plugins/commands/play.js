const Voice = require("@discordjs/voice");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const YoutubeDlWrap = require("youtube-dl-wrap");
const youtubeDlWrap = new YoutubeDlWrap(
  path.resolve("node_modules/youtube-dl/bin/youtube-dl")
);

const { discord } = require("../../bot");

const queue = [];
let connection = null;
const player = Voice.createAudioPlayer({
  behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Stop },
});

module.exports = {
  name: "play",
  description: "Make the music bot play youtube URL's",
  options: [
    {
      name: "url",
      description: "Youtube link",
      type: "STRING",
      required: true,
    },
  ],
  async execute(interaction) {
    const url = interaction.options.getString("url");
    queue.push(url);

    if (!connection) connection = await setup();
    if (player.state.status === "idle") play();

    return interaction.reply({
      content: "Track has been added to the queue",
      ephemeral: true,
    });
  },
};

async function setup() {
  const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const channel = await guild.channels.fetch(process.env.MUSIC_BOT_CHANNEL_ID);

  const connection = Voice.joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connection.on(Voice.VoiceConnectionStatus.Ready, () => {
    connection.subscribe(player);
  });

  return connection;
}

async function play() {
  if (queue.length === 0) {
    connection.disconnect();
    connection.destroy();
    connection = null;
    console.log("disconnected and destroyed due to end of queue");
    return;
  }

  const stream = transcode(queue.shift());
  if (!stream) return play();

  const resource = Voice.createAudioResource(stream);
  player.play(resource);
  player.once(Voice.AudioPlayerStatus.Idle, play);
}

function transcode(url) {
  const ytdl = youtubeDlWrap.execStream([url, "-f", "best"]);
  return ffmpeg(ytdl)
    .native()
    .noVideo()
    .audioCodec("libopus")
    .format("opus")
    .on("error", () => {})
    .stream();
}
