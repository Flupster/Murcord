require("dotenv").config();

module.exports = {
    production: {
      client: "mysql",
      useNullAsDefault: true,
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        charset: "utf8mb4",
        supportBigNumbers: true,
        bigNumberStrings: true
      },
      pool: { min: 0, max: 10 },
      migrations: {
        tableName: "knex_migrations"
      }
    }
  };
  