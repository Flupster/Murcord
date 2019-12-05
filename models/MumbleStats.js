const { Model } = require("objection");
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
}

module.exports = MumbleStats;
