exports.up = function(knex) {
  return knex.schema.createTable("users", table => {
    table.increments("id");
    table.bigInteger("discord_id");
    table.string("username").collate("utf8mb4_bin");
    table.string("password");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
