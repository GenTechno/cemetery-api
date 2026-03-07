import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;

// __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Make sure you have DATABASE_URL in .env
// Example:
// DATABASE_URL=postgres://cemeteryadmin:YOURPASS@YOURSERVER.postgres.database.azure.com:5432/cemeterydb?sslmode=require
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in your .env file");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Path to your JSON file
const dataPath = path.join(__dirname, "data", "cemeteryData.json");

if (!fs.existsSync(dataPath)) {
  console.error("❌ Cannot find file:", dataPath);
  process.exit(1);
}

const cemeteryData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Helper: normalize statuses
function normalizeStatus(s) {
  const v = (s || "").toString().trim().toLowerCase();
  if (v === "occupied") return "Occupied";
  if (v === "reserved") return "Reserved";
  return "Available";
}

// Helper: normalize plot code (fix "OP -001" -> "OP-001")
function normalizePlotCode(code) {
  return (code || "").toString().replace(/\s+/g, "").replace(/-+/g, "-");
}

async function runImport() {
  const client = await pool.connect();

  try {
    console.log("🚀 Import starting...");

    await client.query("BEGIN");

    let cemCount = 0;
    let plotCount = 0;
    let updatedCount = 0;

    for (const [cemeteryName, plotsObj] of Object.entries(cemeteryData)) {
      // --- 1) Ensure cemetery exists ---
      // Try find by name first
      let cemRes = await client.query(
        `SELECT id FROM cemeteries WHERE name = $1 LIMIT 1`,
        [cemeteryName]
      );

      let cemeteryId;

      if (cemRes.rows.length) {
        cemeteryId = cemRes.rows[0].id;
      } else {
        // Insert cemetery
        // If you have "municipality" column, we can set it; otherwise ignore
        // We'll attempt insert with municipality, and if it fails, insert without it.
        try {
          const ins = await client.query(
            `INSERT INTO cemeteries (name, municipality)
             VALUES ($1, $2)
             RETURNING id`,
            [cemeteryName, "Witzenberg Municipality"]
          );
          cemeteryId = ins.rows[0].id;
        } catch (e) {
          const ins = await client.query(
            `INSERT INTO cemeteries (name)
             VALUES ($1)
             RETURNING id`,
            [cemeteryName]
          );
          cemeteryId = ins.rows[0].id;
        }
        cemCount++;
      }

      console.log(`✔ Cemetery: ${cemeteryName} (id=${cemeteryId})`);

      // --- 2) Insert/Update plots ---
      const plotEntries = Object.entries(plotsObj || {});
      for (const [plotCodeRaw, p] of plotEntries) {
        const plot_code = normalizePlotCode(plotCodeRaw);

        // Map your JSON fields to DB columns
        const owner_name = p?.owner || p?.owner_name || "";
        const gender = (p?.gender || "").toString().trim().toUpperCase() || null;
        const status = normalizeStatus(p?.status);
        const payment_date = p?.payment || p?.payment_date || null;

        // Your DB columns are row_num / col_num (from your screenshot)
        const row_num = Number.isFinite(p?.row) ? p.row : (Number.isFinite(p?.row_num) ? p.row_num : null);
        const col_num = Number.isFinite(p?.col) ? p.col : (Number.isFinite(p?.col_num) ? p.col_num : null);

        // coords (Leaflet polygon) stored as JSONB
        const coords = p?.coords || null;

        // Check if plot exists
        const existing = await client.query(
          `SELECT id FROM plots
           WHERE cemetery_id = $1 AND plot_code = $2
           LIMIT 1`,
          [cemeteryId, plot_code]
        );

        if (existing.rows.length) {
          // Update
          await client.query(
            `UPDATE plots
             SET owner_name=$1, gender=$2, status=$3, payment_date=$4,
                 row_num=$5, col_num=$6, coords=$7, updated_at=NOW()
             WHERE id=$8`,
            [owner_name, gender, status, payment_date, row_num, col_num, coords, existing.rows[0].id]
          );
          updatedCount++;
        } else {
          // Insert
          await client.query(
            `INSERT INTO plots
              (cemetery_id, plot_code, owner_name, gender, status, payment_date, row_num, col_num, coords, updated_at)
             VALUES
              ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
            [cemeteryId, plot_code, owner_name, gender, status, payment_date, row_num, col_num, coords]
          );
          plotCount++;
        }
      }
    }

    await client.query("COMMIT");
    console.log("✅ Import complete!");
    console.log(`Cemeteries inserted: ${cemCount}`);
    console.log(`Plots inserted: ${plotCount}`);
    console.log(`Plots updated: ${updatedCount}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed:", err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

runImport();

