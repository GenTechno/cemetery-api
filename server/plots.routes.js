import fs from "fs";
import path from "path";

export function registerPlotRoutes(app) {
  app.get("/api/plots", (req, res) => {
    try {
      const filePath = path.resolve("data/plots.geojson");
      const raw = fs.readFileSync(filePath, "utf-8");
      const geojson = JSON.parse(raw);
      res.json(geojson);
    } catch (e) {
      res.status(500).json({ error: "Failed to load plots", details: e.message });
    }
  });
}
