const { Model } = require("objection");
const { knex, discord, mumble } = require("../bot");

Model.knex(knex);

module.exports.User = require("./User");
