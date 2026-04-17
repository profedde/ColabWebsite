const { Pool } = require("pg");

const FALLBACK_DATABASE_URL =
  "postgresql://postgres:CGhYEoROTtHYwJZGOOpnpAEUijEZdGFA@postgres.railway.internal:5432/railway";

const connectionString = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;
const useSsl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl: useSsl
});

const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    return true;
  } catch (_error) {
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  pool,
  testConnection
};
