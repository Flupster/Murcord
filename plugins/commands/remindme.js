const { redis, discord } = require("../../bot");
const HumanizeDuration = require("humanize-duration");

const scaling = {
  years: 365.25 * 24 * 3600,
  year: 365.25 * 24 * 3600,
  yrs: 365.25 * 24 * 3600,
  y: 365.25 * 24 * 3600,
  months: 29.53059 * 24 * 3600,
  month: 29.53059 * 24 * 3600,
  mo: 29.53059 * 24 * 3600,
  weeks: 7 * 24 * 3600,
  week: 7 * 24 * 3600,
  wks: 7 * 24 * 3600,
  wk: 7 * 24 * 3600,
  w: 7 * 24 * 3600,
  days: 24 * 3600,
  day: 24 * 3600,
  d: 24 * 3600,
  hours: 3600,
  hour: 3600,
  hrs: 3600,
  hr: 3600,
  h: 3600,
  minutes: 60,
  minute: 60,
  mins: 60,
  min: 60,
  m: 60,
  seconds: 1,
  second: 1,
  secs: 1,
  sec: 1,
  s: 1,
};

const regex = new RegExp(
  `(?<value>\\d+) ?(?<unit>${Object.keys(scaling).join("|")})`,
  "gi"
);

function stringToSeconds(input) {
  const match = input.matchAll(regex);
  let seconds = 0;
  for (const m of match) {
    seconds += m.groups.value * scaling[m.groups.unit];
  }
  return seconds;
}

module.exports = {
  name: "remindme",
  description: "Reminds you of something in the future",
  options: [
    {
      name: "when",
      description: "Example: 1d 4h | 1 day 4 hours | 1y | 10s",
      type: "STRING",
      required: true,
    },
    {
      name: "reminder",
      description: "What to be reminded of",
      type: "STRING",
      required: true,
    },
  ],
  async execute(interaction) {
    const user = interaction.user;
    const reminder = interaction.options.getString("reminder");
    const s = stringToSeconds(interaction.options.getString("when"));

    // Time resolution is 0 seconds so the match failed
    if (s === 0) {
      return interaction.reply(
        "Invalid time, use 1d4h | 1 day 4 hours | 1d 4h ..etc",
        { ephemeral: true }
      );
    }

    const data = JSON.stringify({
      user: user.id,
      channel: interaction.channelId,
      reminder,
    });

    // if reminder time is less than 1 hour add to timeouts;
    if (s < 3600) {
      setTimeout(() => sendReminder(data), s * 1000);
    }

    // Store reminder in redis
    await redis.setex(`reminders:${interaction.id}`, s, data);

    // Send response
    const time = HumanizeDuration(s * 1000, {
      round: true,
      largest: 1,
    });

    return interaction.reply(`Reminder set for ${time}: \`${reminder}\``);
  },
};

async function sendReminder(reminder) {
  const user = await discord.users.fetch(reminder.user);
  const channel = await discord.channels.fetch(reminder.channel);
  return await channel.send(`${user} \`${reminder.reminder}\``);
}

// Load reminders from redis
async function nextHourReminders() {
  const keys = await redis.keys("reminders:*");
  const reminders = await Promise.all(
    keys.map(async (key) => ({ ttl: await redis.ttl(key), key }))
  );

  for (const reminder of reminders) {
    // skip reminders greater than 1 hour
    if (reminder.ttl > 3600) continue;

    console.log("[Reminders] Loaded:", reminder.key, reminder.ttl);

    const data = JSON.parse(await redis.get(reminder.key));
    setTimeout(() => sendReminder(data), reminder.ttl * 1000);
  }
}

//Load reminders from redis every hour
setInterval(nextHourReminders, 3600000);
nextHourReminders();
