const { Model } = require("objection");
const { mumble } = require("../bot");
const User = require("./User");

class MumbleStats extends Model {
  static tableName = "mumble_stats";

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "mumble_stats.id",
        to: "users.id"
      }
    }
  };

  OnlineSecs() {
    const muser = mumble.users.get(this.id);
    return muser ? muser.onlinesecs + this.online_secs : this.online_secs;
  }
}

module.exports = MumbleStats;
