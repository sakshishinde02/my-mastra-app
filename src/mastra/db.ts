import pg from "pg";

export const pool = new pg.Pool({
  host: "localhost",   // or host.docker.internal if you run Postgres in Docker
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});
