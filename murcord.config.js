module.exports = {
  apps: [
    {
      name: "murcord",
      script: "./bot.js",
    },
    {
      name: "murcord-auth",
      script: "./mumble/auth.py",
      interpreter: "/usr/bin/python3",
    },
  ],
};
