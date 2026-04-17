const { Pool } = require("pg");

const FALLBACK_DATABASE_URL =
  "postgresql://postgres:CGhYEoROTtHYwJZGOOpnpAEUijEZdGFA@postgres.railway.internal:5432/railway";

const connectionString = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;
const inferSslConfig = () => {
  if (process.env.PGSSL === "disable") {
    return false;
  }
  if (process.env.PGSSL === "require") {
    return { rejectUnauthorized: false };
  }

  try {
    const host = new URL(connectionString).hostname.toLowerCase();
    if (host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1") {
      return false;
    }
  } catch (_error) {
    // Fallback to SSL enabled when URL parsing fails.
  }

  return { rejectUnauthorized: false };
};

const pool = new Pool({
  connectionString,
  ssl: inferSslConfig(),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 5000),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10000),
  max: Number(process.env.PG_POOL_MAX || 10)
});

const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    return true;
  } catch (error) {
    if (process.env.DEBUG_DB === "true") {
      console.error("Database health check failed:", error.message);
    }
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
