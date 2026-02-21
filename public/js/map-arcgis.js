const statusEl = document.getElementById("status");
function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

setStatus("Loading ArcGIS…");

require(
  ["esri/Map", "esri/views/MapView"],
  function (Map, MapView) {

    const map = new Map({ basemap: "satellite" });

    const view = new MapView({
      container: "viewDiv",
      map,
      center: [19.31, -33.36],
      zoom: 16
    });

    view.when(() => setStatus("Ready ✅"))
        .catch((e) => { setStatus("Error ❌"); console.error(e); });
  },
  function (err) {
    setStatus("Failed to load modules ❌");
    console.error(err);
  }
);
