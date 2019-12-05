const { Model } = require("objection");
const { discord, mumble } = require("../bot");
const MumbleStats = require("./MumbleStats");

class User extends Model {
  static tableName = "users";

  static relationMappings = {
    mumble_stats: {
      relation: Model.HasOneRelation,
      modelClass: MumbleStats,
      join: {
        from: "users.id",
        to: "mumble_stats.id"
      }
    }
  };

  discord() {
    return discord.fetchUser(this.discord_id);
  }

  mumble() {
    return mumble.users.get(this.id);
  }
}

module.exports = User;
