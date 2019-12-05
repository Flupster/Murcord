const { Model } = require("objection");
const { knex } = require("../bot");

Model.knex(knex);

module.exports.User = require("./User");
module.exports.MumbleStats = require("./MumbleStats");
