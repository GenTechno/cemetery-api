let map;
let plotsLayer;
let myLocationMarker;
let myAccuracyCircle;
let lastMyLatLng = null;

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "available") return "green";
  if (s === "reserved") return "orange";
  return "red";
}

function makeMarkerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:999px;
      background:${color};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function setPlotDetails(feature) {
  const props = feature.properties || {};
  const latlng = feature.geometry?.coordinates
    ? { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
    : null;

  let distHtml = "";
  if (lastMyLatLng && latlng) {
    const m = distanceMeters(lastMyLatLng, latlng);
    distHtml = `<div><span class="font-semibold">Distance:</span> ${m.toFixed(0)} m</div>`;
  }

  const el = document.getElementById("plotDetails");

  const plotId = props.plot_id || props.plot_code || "N/A";
  const status = props.status || "occupied";
  const section = props.section ?? "-";
  const row = props.row ?? "-";
  const plotNo = props.plot_no ?? "-";
  const deceased = props.deceased_name ?? "—";
  const graveType = props.grave_type ?? "burial";

  const navUrl = latlng
    ? `https://www.google.com/maps/dir/?api=1&destination=${latlng.lat},${latlng.lng}`
    : null;

  el.innerHTML = `
    <div class="space-y-2">
      <div><span class="font-semibold">Plot ID:</span> ${plotId}</div>
      <div><span class="font-semibold">Status:</span> ${status}</div>
      <div><span class="font-semibold">Type:</span> ${graveType}</div>

      ${distHtml}

      <div><span class="font-semibold">Section/Row/No:</span> ${section} / ${row} / ${plotNo}</div>
      <div><span class="font-semibold">Deceased:</span> ${deceased}</div>

      ${latlng ? `<div class="text-xs text-gray-500">
        GPS: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}
      </div>` : ""}

      <div class="pt-2 flex gap-2">
  ${navUrl ? `<a class="px-3 py-2 rounded bg-emerald-600 text-white text-sm"
    href="${navUrl}" target="_blank" rel="noreferrer">🧭 Navigate</a>` : ""}

  ${latlng ? `<button id="btnZoom"
    class="px-3 py-2 rounded bg-gray-800 text-white text-sm">🔎 Zoom to Plot</button>` : ""}

  <button id="btnCaptureGps"
    class="px-3 py-2 rounded bg-blue-600 text-white text-sm">📍 Capture GPS</button>
</div>
 </div>
  `;

  if (latlng) {
    const btnZoom = document.getElementById("btnZoom");
    btnZoom?.addEventListener("click", () => {
      map.setView([latlng.lat, latlng.lng], 20);
    });
  }
}
const btnCapture = document.getElementById("btnCaptureGps");
btnCapture?.addEventListener("click", async () => {
  try {
    if (!props.id && !props.plot_id) {
      alert("This plot does not have a database id in the GeoJSON properties.");
      return;
    }

    if (!lastMyLatLng) {
      alert("Please click 'My Location' first so GPS can be captured.");
      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt");

    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

    // Use the DB id from GeoJSON properties (prefer `id`)
    const plotDbId = props.id || props.plot_id;

    const res = await fetch(`/api/plots/${plotDbId}/coords`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        lat: lastMyLatLng.lat,
        lng: lastMyLatLng.lng,
        accuracy: null,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Capture GPS failed:", res.status, text);
      alert(`Failed to save GPS (${res.status}). Make sure you are Manager/Administrator.`);
      return;
    }

    alert("✅ GPS saved to plot.");
    await loadPlots(); // refresh markers
  } catch (e) {
    console.error(e);
    alert("Error saving GPS: " + e.message);
  }
});

async function loadPlots() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt");

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch("/api/plots", { headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Failed /api/plots:", res.status, text);
    throw new Error(`Failed to load plots (${res.status})`);
  }

  const geojson = await res.json();

  if (plotsLayer) plotsLayer.remove();

  plotsLayer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const c = statusColor(feature.properties?.status);
      return L.marker(latlng, { icon: makeMarkerIcon(c) });
    },
    onEachFeature: (feature, layer) => {
      layer.on("click", () => setPlotDetails(feature));
    },
  }).addTo(map);

  try {
    const bounds = plotsLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
  } catch {}
}

function locateMe() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported on this device/browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      lastMyLatLng = { lat: latitude, lng: longitude };

      if (myLocationMarker) myLocationMarker.remove();
      if (myAccuracyCircle) myAccuracyCircle.remove();

      myLocationMarker = L.marker([latitude, longitude]).addTo(map);
      myAccuracyCircle = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

      map.setView([latitude, longitude], 19);
    },
    (err) => {
      alert("Could not get GPS location: " + err.message);
    },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
  );
}

function init() {
  map = L.map("map").setView([-33.368, 19.311], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 22,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  document.getElementById("btnLocate").addEventListener("click", locateMe);
  document.getElementById("btnReload").addEventListener("click", () => loadPlots().catch(console.error));

  loadPlots().catch((e) => {
    console.error(e);
    alert("Could not load plots.");
  });
}

init();
