import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasPgParts =
  process.env.PGHOST &&
  process.env.PGUSER &&
  process.env.PGDATABASE;

export const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Render / most managed Postgres commonly need SSL
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      // Azure PostgreSQL requires SSL (and this is also fine for many hosted DBs)
      ssl: { rejectUnauthorized: false },
    });

// Optional: helpful log (won't crash if missing)
if (!hasDatabaseUrl && !hasPgParts) {
  console.warn("⚠️ DB env not set. Provide DATABASE_URL or PGHOST/PGUSER/PGDATABASE/PGPASSWORD.");
}
