import "dotenv/config";
import pg from "pg";
import dns from "dns";

// ✅ Prefer IPv4 results first (fixes ENETUNREACH IPv6 issues)
dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    });