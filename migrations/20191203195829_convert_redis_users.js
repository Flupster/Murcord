const Redis = require("ioredis");
const redis = new Redis();

exports.up = function(knex) {
  redis.keys("mumbleid:*").then(async keys => {
    keys.forEach(async key => {
      const discord_id = key.split(":")[1];
      if (discord_id === "pointer") return;

      const user_id = parseInt(await redis.get(key));
      const password = await redis.get("mumblepass:" + discord_id);

      try {
        await knex("users").insert({ discord_id, id: user_id, password });
      } catch (ex) {
        console.error("Redis user convert failed for user:", user_id);
      }
    });
  });
};

exports.down = function(knex) {};
