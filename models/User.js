const { Model } = require("objection");
const { discord, mumble } = require("../bot");

class User extends Model {
  static get tableName() {
    return "users";
  }

  discord() {
    return discord.fetchUser(this.discord_id);
  }

  mumble() {
    return mumble.users.get(this.id);
  }
}

module.exports = User;
