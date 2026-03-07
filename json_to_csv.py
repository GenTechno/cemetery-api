import json
import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
JSON_FILE = BASE_DIR / "data" / "cemeteryData.json"
CSV_FILE  = BASE_DIR / "data" / "plots_import.csv"


def safe_int(value):
    try:
        return int(value)
    except:
        return None


def normalize_status(status):
    if not status:
        return ""
    s = str(status).strip().lower()
    if s == "available":
        return "Available"
    if s == "reserved":
        return "Reserved"
    if s in ("occupied", "sold", "taken"):
        return "Occupied"
    return status


def main():
    if not JSON_FILE.exists():
        raise FileNotFoundError(f"JSON file not found: {JSON_FILE}")

    data = json.loads(JSON_FILE.read_text(encoding="utf-8"))

    rows = []

    for cemetery_name, plots in data.items():
        if not isinstance(plots, dict):
            continue

        for plot_code, plot in plots.items():
            if not isinstance(plot, dict):
                plot = {}

            row = {
                "cemetery_name": cemetery_name,
                "plot_code": plot_code,
                "owner_name": plot.get("owner") or plot.get("owner_name"),
                "gender": plot.get("gender"),
                "status": normalize_status(plot.get("status")),
                "payment_date": plot.get("payment") or plot.get("payment_date"),
                "row_num": safe_int(plot.get("row") or plot.get("row_num")),
                "col_num": safe_int(plot.get("col") or plot.get("col_num")),
                "coords": json.dumps(plot.get("coords")) if plot.get("coords") else None,
                "source_json": json.dumps(plot)
            }

            rows.append(row)

    with CSV_FILE.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "cemetery_name",
                "plot_code",
                "owner_name",
                "gender",
                "status",
                "payment_date",
                "row_num",
                "col_num",
                "coords",
                "source_json",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print("✅ CSV CREATED SUCCESSFULLY")
    print(f"📄 File: {CSV_FILE}")
    print(f"📊 Rows exported: {len(rows)}")


if __name__ == "__main__":
    main()
