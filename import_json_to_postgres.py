import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values, Json

# =========================
# EDIT THESE 5 VALUES ONLY
# =========================
PGHOST = "wit-ct-cemetery-pg.postgres.database.azure.com"
PGPORT = 5432
PGDATABASE = "cemeterydb"
# IMPORTANT on Azure: username is often "user@servername"
PGUSER = "cemeteryadmin"
PGPASSWORD = "Postgress2025"

JSON_PATH = os.path.join("data", "cemeteryData.json")


def pick(plot: dict, *keys, default=None):
    """Return first existing key value from plot dict."""
    for k in keys:
        if k in plot and plot[k] not in (None, ""):
            return plot[k]
    return default


def normalize_status(s):
    if not s:
        return "Available"
    s = str(s).strip().lower()
    if s in ("available",):
        return "Available"
    if s in ("reserved", "booked", "hold"):
        return "Reserved"
    if s in ("occupied", "taken"):
        return "Occupied"
    # fallback
    return "Available"


def parse_date(val):
    if not val:
        return None
    # expects 'YYYY-MM-DD' mostly
    try:
        return str(val)[:10]
    except Exception:
        return None


def connect():
    return psycopg2.connect(
        host=PGHOST,
        port=PGPORT,
        dbname=PGDATABASE,
        user=PGUSER,
        password=PGPASSWORD,
        sslmode="require",
    )


def ensure_municipality_column(cur):
    # If you already added it, this will just do nothing.
    cur.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='cemeteries' AND column_name='municipality'
        ) THEN
            ALTER TABLE public.cemeteries ADD COLUMN municipality TEXT;
        END IF;
    END $$;
    """)


def main():
    if not os.path.exists(JSON_PATH):
        raise FileNotFoundError(f"Cannot find {JSON_PATH}. Put your JSON in data/cemeteryData.json")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # data expected like: { "Ceres": { "CER-001": {...}, ... }, "Bella Vista": {...} }
    cemetery_names = list(data.keys())

    conn = connect()
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            ensure_municipality_column(cur)

            # 1) Insert cemeteries (skip duplicates by name)
            execute_values(
                cur,
                """
                INSERT INTO public.cemeteries (name, municipality)
                VALUES %s
                ON CONFLICT (name) DO NOTHING
                """,
                [(name, None) for name in cemetery_names],
            )

            # 2) Build cemetery name -> id map
            cur.execute("SELECT id, name FROM public.cemeteries;")
            cemetery_map = {name: cid for (cid, name) in cur.fetchall()}

            # 3) Build plot rows
            plot_rows = []
            for cemetery_name, plots_dict in data.items():
                cemetery_id = cemetery_map.get(cemetery_name)
                if not cemetery_id:
                    print(f"Skipping cemetery '{cemetery_name}' (no cemetery_id found).")
                    continue

                # plots_dict like { "CER-001": {...}, "CER-002": {...} }
                for plot_code, plot in (plots_dict or {}).items():
                    if not isinstance(plot, dict):
                        plot = {}

                    owner_name = pick(plot, "owner_name", "owner", "name")
                    gender = pick(plot, "gender")
                    status = normalize_status(pick(plot, "status"))
                    payment_date = parse_date(pick(plot, "payment_date", "payment"))

                    row_num = pick(plot, "row_num", "row_no", "row", default=None)
                    col_num = pick(plot, "col_num", "col_no", "col", default=None)

                    # coords should be JSON compatible (list/dict). Keep as-is.
                    coords = pick(plot, "coords", "coordinates", "polygon", default=None)

                    updated_at = datetime.utcnow()

                    plot_rows.append((
                        cemetery_id,
                        str(plot_code).strip(),
                        owner_name,
                        gender,
                        status,
                        payment_date,
                        row_num,
                        col_num,
                        Json(coords) if coords is not None else None,
                        updated_at
                    ))

            if not plot_rows:
                print("No plot rows found in JSON. Nothing to import.")
                conn.rollback()
                return

            # 4) Insert plots (skip duplicates if you added UNIQUE(cemetery_id, plot_code))
            execute_values(
                cur,
                """
                INSERT INTO public.plots
                (cemetery_id, plot_code, owner_name, gender, status, payment_date, row_num, col_num, coords, updated_at)
                VALUES %s
                ON CONFLICT (cemetery_id, plot_code) DO UPDATE SET
                    owner_name = EXCLUDED.owner_name,
                    gender = EXCLUDED.gender,
                    status = EXCLUDED.status,
                    payment_date = EXCLUDED.payment_date,
                    row_num = EXCLUDED.row_num,
                    col_num = EXCLUDED.col_num,
                    coords = EXCLUDED.coords,
                    updated_at = EXCLUDED.updated_at
                """,
                plot_rows,
                page_size=1000
            )

            conn.commit()
            print(f"✅ Import complete: cemeteries={len(cemetery_names)}, plots={len(plot_rows)}")

    except Exception as e:
        conn.rollback()
        print("❌ Import failed:")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
