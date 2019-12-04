exports.up = function(knex) {
  return knex.schema.createTable("mumble_stats", table => {
    table.integer("id").primary();
    table.dateTime("last_seen");
    table.integer("connects");
    table.bigInteger("online_secs");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("mumble_stats");
};
