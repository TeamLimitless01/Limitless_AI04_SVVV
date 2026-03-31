const path = require("path");

module.exports = ({ env }) => {
  return {
    connection: {
      client: "postgres",
      connection: {
        host: env("PGHOST", "127.0.0.1"),
        port: env.int("PGPORT", 24569),
        database: env("PGDATABASE", "strapi"),
        user: env("PGUSER", "strapi"),
        password: env("PGPASSWORD", "password"),
        // ssl: true,
      },
    },
  };
};
