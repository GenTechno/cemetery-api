// server.js (ESM) — COMPLETE
import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./server/db.js";

const app = express();

/* --------------------------------------------------
   MIDDLEWARE
-------------------------------------------------- */
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// NOTE: Express v5 + path-to-regexp v6 breaks routes like "*"
// We avoid any app.get("*") / app.options("*") patterns.
app.use(express.json({ limit: "5mb" }));

/* --------------------------------------------------
   PATH SETUP (ESM SAFE)
-------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --------------------------------------------------
   CONFIG
-------------------------------------------------- */
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const APP_MODE = String(process.env.APP_MODE || "prod").toLowerCase();
const isDemo = APP_MODE === "demo";

// LIMIT: user requested 10 plots per cemetery (for ALL cemeteries)
const PLOTS_PER_CEMETERY_LIMIT = Number(process.env.PLOTS_PER_CEMETERY_LIMIT || 10);

// Email toggles
const DISABLE_EMAIL = String(process.env.DISABLE_EMAIL || "").toLowerCase() === "true";

/* --------------------------------------------------
   PUBLIC CONFIG ENDPOINT
-------------------------------------------------- */
app.get("/api/config", (req, res) => {
  res.json({ appMode: APP_MODE, isDemo, plotsPerCemeteryLimit: PLOTS_PER_CEMETERY_LIMIT });
});

/* --------------------------------------------------
   STATIC FILES
-------------------------------------------------- */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Prevent caching HTML during dev
  if (req.path.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use("/basemaps", express.static(path.join(__dirname, "public", "basemaps")));
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/public-portal", (req, res) => res.sendFile(path.join(__dirname, "public", "public-portal.html")));
app.get("/arcgis-demo", (req, res) => res.sendFile(path.join(__dirname, "public", "arcgis-demo.html")));
app.get("/arcgis-demo.html", (req, res) => res.sendFile(path.join(__dirname, "public", "arcgis-demo.html")));
app.get("/gis", (req, res) => res.sendFile(path.join(__dirname, "public", "map.html")));

/* --------------------------------------------------
   USERS (TEMP / DEMO)
-------------------------------------------------- */
const users = [
  { username: "manager", role: "manager", permission: "full", passwordHash: bcrypt.hashSync("Manager@123", 10) },
  { username: "administrator", role: "administrator", permission: "full", passwordHash: bcrypt.hashSync("Admin@123", 10) },
  { username: "supervisor", role: "supervisor", permission: "read", passwordHash: bcrypt.hashSync("Supervisor@123", 10) },
];

/* --------------------------------------------------
   AUTH HELPERS
-------------------------------------------------- */
function signToken(user) {
  return jwt.sign(
    { username: user.username, role: user.role, permission: user.permission },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function authRequired(req, res, next) {
  const token = (req.headers.authorization || "").split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireFullControl(req, res, next) {
  if (req.user?.permission !== "full") return res.status(403).json({ error: "Read-only role" });
  next();
}

/* --------------------------------------------------
   EMAIL (SMTP) — uses your env:
   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, NOTIFY_TO
-------------------------------------------------- */
const NOTIFY_TO = (process.env.NOTIFY_TO || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@example.com";

const emailEnabled = Boolean(
  !DISABLE_EMAIL &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    NOTIFY_TO.length
);

const mailTransporter = emailEnabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    })
  : null;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[m] || m;
  });
}

async function sendMail({ subject, html }) {
  if (!emailEnabled || !mailTransporter) return;
  try {
    await mailTransporter.sendMail({
      from: MAIL_FROM,
      to: NOTIFY_TO.join(", "),
      subject,
      html,
    });
  } catch (e) {
    console.error("❌ Email send failed:", e.message);
  }
}

app.get("/debug/email-test", async (req, res) => {
  try {
    if (!mailTransporter) return res.status(500).json({ ok: false, error: "Email disabled / not configured" });
    const info = await mailTransporter.sendMail({
      from: MAIL_FROM,
      to: NOTIFY_TO.join(", "),
      subject: "✅ Cemetery Cloud Test Email",
      html: `<h3>SMTP test OK</h3><p>Time: ${esc(new Date().toLocaleString())}</p>`,
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* --------------------------------------------------
   AUDIT LOG (safe)
   Recommended table:
   CREATE TABLE audit_logs (
     id bigserial primary key,
     created_at timestamptz default now(),
     action text not null,
     entity_type text not null,
     entity_id bigint null,
     cemetery_id bigint null,
     plot_code text null,
     actor_username text null,
     actor_role text null,
     ip_address text null,
     details jsonb not null default '{}'::jsonb
   );
-------------------------------------------------- */
async function writeAuditSafe(req, { action, entity_type = "plot", entity_id = null, cemetery_id = null, plot_code = null, details = {} }) {
  try {
    const actor_username = req.user?.username || null;
    const actor_role = req.user?.role || null;
    const ip_address =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || null;

    await pool.query(
      `
      INSERT INTO audit_logs
        (action, entity_type, entity_id, cemetery_id, plot_code, actor_username, actor_role, ip_address, details)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
      `,
      [
        action,
        entity_type,
        entity_id,
        cemetery_id,
        plot_code,
        actor_username,
        actor_role,
        ip_address,
        JSON.stringify(details || {}),
      ]
    );
  } catch (e) {
    console.warn("⚠️ Audit skipped:", e.message);
  }
}

async function getCemeteryName(cemeteryId) {
  const r = await pool.query("SELECT name FROM cemeteries WHERE id=$1", [cemeteryId]);
  return r.rows[0]?.name || "";
}

function nice(v) {
  return v === null || v === undefined ? "" : String(v);
}

/* --------------------------------------------------
   LOGIN
-------------------------------------------------- */
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === String(username || "").toLowerCase());

  if (!user) return res.status(401).json({ error: "Invalid login" });
  if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid login" });

  res.json({
    token: signToken(user),
    user: { username: user.username, role: user.role, permission: user.permission },
  });
});

/* --------------------------------------------------
   HEALTH
-------------------------------------------------- */
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* --------------------------------------------------
   CEMETERIES
-------------------------------------------------- */
app.get("/api/cemeteries", authRequired, async (req, res) => {
  const r = await pool.query("SELECT id,name FROM cemeteries ORDER BY name");
  res.json(r.rows);
});

/* --------------------------------------------------
   PLOTS LIST (10 per cemetery)
   dashboard uses: GET /api/cemeteries/:id/plots
-------------------------------------------------- */
app.get("/api/cemeteries/:id/plots", authRequired, async (req, res) => {
  try {
    const includeDeleted = String(req.query.include_deleted || "").toLowerCase() === "true";

    const r = await pool.query(
      `
      SELECT *
      FROM plots
      WHERE cemetery_id = $1
        AND ($2::boolean = true OR deleted_at IS NULL)
      ORDER BY plot_code
      LIMIT $3
      `,
      [req.params.id, includeDeleted, PLOTS_PER_CEMETERY_LIMIT]
    );

    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --------------------------------------------------
   CREATE PLOT (optional)
-------------------------------------------------- */
app.post("/api/plots", authRequired, requireFullControl, async (req, res) => {
  try {
    const { cemetery_id, plot_code, status, owner_name, gender, payment_date, row_num, col_num, coords } = req.body || {};
    if (!cemetery_id || !plot_code) return res.status(400).json({ error: "cemetery_id and plot_code are required" });

    // enforce max 10 per cemetery
    const count = await pool.query(
      `SELECT COUNT(*)::int AS n FROM plots WHERE cemetery_id=$1 AND deleted_at IS NULL`,
      [cemetery_id]
    );
    if ((count.rows[0]?.n || 0) >= PLOTS_PER_CEMETERY_LIMIT) {
      return res.status(400).json({ error: `Plot limit reached (${PLOTS_PER_CEMETERY_LIMIT} plots per cemetery)` });
    }

    const created = await pool.query(
      `
      INSERT INTO plots
        (cemetery_id, plot_code, status, owner_name, gender, payment_date, row_num, col_num, coords, created_at, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW())
      RETURNING *
      `,
      [
        cemetery_id,
        String(plot_code).trim(),
        status || "Available",
        owner_name || null,
        gender || null,
        payment_date || null,
        row_num ?? null,
        col_num ?? null,
        coords ? JSON.stringify(coords) : null,
      ]
    );

    const plot = created.rows[0];

    await writeAuditSafe(req, {
      action: "CREATE_PLOT",
      entity_id: plot.id,
      cemetery_id: plot.cemetery_id,
      plot_code: plot.plot_code,
      details: { status: plot.status, owner_name: plot.owner_name, gender: plot.gender },
    });

    const cemeteryName = await getCemeteryName(plot.cemetery_id);
    await sendMail({
      subject: `✅ Plot Created: ${plot.plot_code} (${cemeteryName})`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Plot Created</h2>
          <p><b>Cemetery:</b> ${esc(cemeteryName)}</p>
          <p><b>Plot:</b> ${esc(plot.plot_code)}</p>
          <p><b>Status:</b> ${esc(plot.status || "")}</p>
          <hr/>
          <p><b>By:</b> ${esc(req.user?.username || "")} (${esc(req.user?.role || "")})</p>
        </div>
      `,
    });

    res.status(201).json(plot);
  } catch (e) {
    console.error("POST /api/plots error:", e);
    res.status(500).json({ error: e.message || "Failed to create plot" });
  }
});

/* --------------------------------------------------
   UPDATE PLOT (dashboard “Save changes”)
-------------------------------------------------- */
app.patch("/api/plots/:id", authRequired, requireFullControl, async (req, res) => {
  try {
    const id = req.params.id;

    const beforeQ = await pool.query(
      `SELECT p.*, c.name AS cemetery_name
       FROM plots p
       JOIN cemeteries c ON c.id = p.cemetery_id
       WHERE p.id=$1 AND p.deleted_at IS NULL`,
      [id]
    );
    if (!beforeQ.rows.length) return res.status(404).json({ error: "Plot not found" });
    const before = beforeQ.rows[0];

    const { owner_name, gender, status, payment_date, row_num, col_num, coords } = req.body || {};
    const coordsJson = coords ? JSON.stringify(coords) : null;

    const result = await pool.query(
      `
      UPDATE plots
      SET
        owner_name   = COALESCE($1, owner_name),
        gender       = COALESCE($2, gender),
        status       = COALESCE($3, status),
        payment_date = COALESCE($4, payment_date),
        row_num      = COALESCE($5, row_num),
        col_num      = COALESCE($6, col_num),
        coords       = COALESCE($7, coords),
        updated_at   = NOW()
      WHERE id = $8
      RETURNING *
      `,
      [
        owner_name ?? null,
        gender ?? null,
        status ?? null,
        payment_date ?? null,
        row_num ?? null,
        col_num ?? null,
        coordsJson,
        id,
      ]
    );

    const after = result.rows[0];

    await writeAuditSafe(req, {
      action: "UPDATE_PLOT",
      entity_id: after.id,
      cemetery_id: after.cemetery_id,
      plot_code: after.plot_code,
      details: {
        before: { status: before.status, owner_name: before.owner_name, gender: before.gender, has_coords: !!before.coords },
        after: { status: after.status, owner_name: after.owner_name, gender: after.gender, has_coords: !!after.coords },
      },
    });

    await sendMail({
      subject: `✏️ Plot Updated: ${after.plot_code} (${before.cemetery_name || ""})`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Plot Updated</h2>
          <p><b>Cemetery:</b> ${esc(before.cemetery_name || "")}</p>
          <p><b>Plot:</b> ${esc(after.plot_code || after.id)}</p>
          <p><b>User:</b> ${esc(req.user?.username || "")} (${esc(req.user?.role || "")})</p>
          <hr/>
          <h3>Before</h3>
          <pre>${esc(JSON.stringify({
            status: before.status,
            owner_name: before.owner_name,
            gender: before.gender,
            row_num: before.row_num,
            col_num: before.col_num,
            has_coords: !!before.coords,
          }, null, 2))}</pre>
          <h3>After</h3>
          <pre>${esc(JSON.stringify({
            status: after.status,
            owner_name: after.owner_name,
            gender: after.gender,
            row_num: after.row_num,
            col_num: after.col_num,
            has_coords: !!after.coords,
          }, null, 2))}</pre>
        </div>
      `,
    });

    res.json(after);
  } catch (e) {
    console.error("PATCH /api/plots/:id error:", e);
    res.status(500).json({ error: "Failed to update plot" });
  }
});

/* --------------------------------------------------
   DELETE PLOT (SOFT DELETE) — dashboard “Delete plot”
-------------------------------------------------- */
app.delete("/api/plots/:id", authRequired, requireFullControl, async (req, res) => {
  try {
    const id = req.params.id;

    const before = await pool.query(
      `SELECT p.*, c.name AS cemetery_name
       FROM plots p
       JOIN cemeteries c ON c.id = p.cemetery_id
       WHERE p.id=$1 AND p.deleted_at IS NULL`,
      [id]
    );
    if (!before.rows.length) return res.status(404).json({ error: "Plot not found or already deleted" });

    const plot = before.rows[0];

    await pool.query(`UPDATE plots SET deleted_at = NOW(), updated_at = NOW() WHERE id=$1`, [id]);

    await writeAuditSafe(req, {
      action: "DELETE_PLOT",
      entity_id: plot.id,
      cemetery_id: plot.cemetery_id,
      plot_code: plot.plot_code,
      details: { status: plot.status, owner_name: plot.owner_name, gender: plot.gender },
    });

    await sendMail({
      subject: `🗑️ Plot Deleted: ${plot.plot_code} (${plot.cemetery_name || ""})`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Plot Deleted</h2>
          <p><b>Cemetery:</b> ${esc(plot.cemetery_name || "")}</p>
          <p><b>Plot:</b> ${esc(plot.plot_code || plot.id)}</p>
          <p><b>Deleted by:</b> ${esc(req.user?.username || "")} (${esc(req.user?.role || "")})</p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/plots/:id error:", e);
    res.status(500).json({ error: e.message || "Failed to delete plot" });
  }
});

/* --------------------------------------------------
   DECEASED REGISTER (FIXES your POST error)
   dashboard expects: POST /api/plots/:plotId/deceased
-------------------------------------------------- */
app.get("/api/plots/:plotId/deceased", authRequired, async (req, res) => {
  try {
    const plotId = Number(req.params.plotId);
    const r = await pool.query(
      `SELECT *
       FROM deceased_records
       WHERE plot_id = $1
       ORDER BY burial_date DESC NULLS LAST, id DESC`,
      [plotId]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/plots/:plotId/deceased", authRequired, requireFullControl, async (req, res) => {
  try {
    const plotId = Number(req.params.plotId);

    const {
      deceased_full_name,
      id_number,
      date_of_birth,
      date_of_death,
      burial_type,
      burial_date,
      next_of_kin_name,
      next_of_kin_relationship,
      next_of_kin_phone,
      next_of_kin_email,
      next_of_kin_address,
      undertaker_name,
      undertaker_phone,
      cause_of_death,
      notes,
    } = req.body || {};

    if (!deceased_full_name || String(deceased_full_name).trim().length < 2) {
      return res.status(400).json({ error: "deceased_full_name is required" });
    }

    const r = await pool.query(
      `INSERT INTO deceased_records (
        plot_id,
        deceased_full_name, id_number, date_of_birth, date_of_death,
        burial_type, burial_date,
        next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, next_of_kin_email, next_of_kin_address,
        undertaker_name, undertaker_phone,
        cause_of_death, notes
      )
      VALUES (
        $1,
        $2, $3, $4, $5,
        $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14,
        $15, $16
      )
      RETURNING *`,
      [
        plotId,
        String(deceased_full_name).trim(),
        id_number || null,
        date_of_birth || null,
        date_of_death || null,
        (burial_type || "BURIAL").toUpperCase(), // BURIAL | CREMATION | REBURIAL etc
        burial_date || null,
        next_of_kin_name || null,
        next_of_kin_relationship || null,
        next_of_kin_phone || null,
        next_of_kin_email || null,
        next_of_kin_address || null,
        undertaker_name || null,
        undertaker_phone || null,
        cause_of_death || null,
        notes || null,
      ]
    );

    const created = r.rows[0];

    await writeAuditSafe(req, {
      action: "CREATE_DECEASED",
      entity_type: "deceased",
      entity_id: created.id,
      cemetery_id: null,
      plot_code: null,
      details: { plot_id: plotId, deceased_full_name: created.deceased_full_name, burial_type: created.burial_type },
    });

    // optional email
    await sendMail({
      subject: `⚰️ Deceased record added: ${nice(created.deceased_full_name)}`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Deceased record added</h2>
          <p><b>Name:</b> ${esc(created.deceased_full_name)}</p>
          <p><b>Plot ID:</b> ${esc(plotId)}</p>
          <p><b>Type:</b> ${esc(created.burial_type || "")}</p>
          <p><b>Burial date:</b> ${esc(created.burial_date || "")}</p>
          <hr/>
          <p><b>By:</b> ${esc(req.user?.username || "")} (${esc(req.user?.role || "")})</p>
        </div>
      `,
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("POST /api/plots/:plotId/deceased error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/deceased/:id", authRequired, requireFullControl, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const fields = [
      "deceased_full_name",
      "id_number",
      "date_of_birth",
      "date_of_death",
      "burial_type",
      "burial_date",
      "next_of_kin_name",
      "next_of_kin_relationship",
      "next_of_kin_phone",
      "next_of_kin_email",
      "next_of_kin_address",
      "undertaker_name",
      "undertaker_phone",
      "cause_of_death",
      "notes",
    ];

    const sets = fields.map((f, i) => `${f} = COALESCE($${i + 1}, ${f})`).join(", ");
    const values = fields.map((f) => (req.body?.[f] === "" ? null : req.body?.[f] ?? null));
    values.push(id);

    const r = await pool.query(
      `UPDATE deceased_records
       SET ${sets}
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      values
    );

    if (r.rowCount === 0) return res.status(404).json({ error: "Record not found" });

    await writeAuditSafe(req, {
      action: "UPDATE_DECEASED",
      entity_type: "deceased",
      entity_id: r.rows[0].id,
      details: { updated_fields: Object.keys(req.body || {}) },
    });

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --------------------------------------------------
   OPTIONAL: Public search
-------------------------------------------------- */
app.get("/public/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.status(400).json({ error: "Min 2 chars" });

    const r = await pool.query(
      `
      SELECT
        p.plot_code,
        p.status,
        p.row_num,
        p.col_num,
        c.name AS cemetery_name
      FROM plots p
      JOIN cemeteries c ON c.id = p.cemetery_id
      WHERE (p.owner_name ILIKE $1 OR p.plot_code ILIKE $1)
        AND p.deleted_at IS NULL
      ORDER BY c.name, p.plot_code
      LIMIT 50
      `,
      [`%${q}%`]
    );

    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --------------------------------------------------
   UPLOAD PLACEHOLDER (kept)
-------------------------------------------------- */
const upload = multer({ storage: multer.memoryStorage() });
// (Add import routes later if needed)

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`App mode = ${APP_MODE} (isDemo=${isDemo})`);
  console.log(`Plots per cemetery limit = ${PLOTS_PER_CEMETERY_LIMIT}`);
  console.log(`Email enabled = ${emailEnabled} (recipients: ${NOTIFY_TO.length})`);

  if (mailTransporter) {
    try {
      await mailTransporter.verify();
      console.log("📧 SMTP ready");
    } catch (e) {
      console.log("❌ SMTP verify failed:", e.message);
    }
  }
});
