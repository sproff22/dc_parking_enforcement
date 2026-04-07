import { useState, useEffect } from "react";
import DC_WARDS_GEOJSON from "../data/wardBoundaries";

// Ray-casting point-in-polygon test for a single ring
function pointInRing(point, ring) {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function findWard(lat, lng) {
  for (const feature of DC_WARDS_GEOJSON.features) {
    const geom = feature.geometry;
    const coords = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
    for (const polygon of coords) {
      if (pointInRing([lng, lat], polygon[0])) {
        return parseInt(feature.properties.WARD);
      }
    }
  }
  return null;
}

export default function AddressSearch({ onResult, theme, resetKey }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear input when resetKey changes (Reset Filters clicked)
  useEffect(() => { setQuery(""); setError(""); }, [resetKey]);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const searchQuery = q.toLowerCase().includes("dc") || q.toLowerCase().includes("washington")
        ? q
        : `${q}, Washington, DC`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=us`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CSE6242-DVA-Group103-ParkingExplorer/1.0" },
      });
      const results = await res.json();
      if (!results.length) {
        setError("Address not found");
        setLoading(false);
        return;
      }
      const { lat, lon } = results[0];
      const latF = parseFloat(lat);
      const lngF = parseFloat(lon);
      const ward = findWard(latF, lngF);
      if (ward) {
        onResult({ ward, lat: latF, lng: lngF });
        setError("");
      } else {
        setError("Location is outside DC wards");
      }
    } catch {
      setError("Geocoding failed");
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 4 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search address..."
          style={{
            flex: 1, background: theme.inputBg, border: `1px solid ${theme.border}`,
            borderRadius: 4, padding: "5px 8px", fontSize: 11, color: theme.text,
            outline: "none",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            background: "#3b82f6", color: "white", border: "none", borderRadius: 4,
            padding: "4px 8px", fontSize: 11, cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "Go"}
        </button>
      </div>
      {error && <div style={{ fontSize: 10, color: "#ef4444" }}>{error}</div>}
    </div>
  );
}
