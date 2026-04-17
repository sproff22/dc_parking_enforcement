import { useState, useEffect, useRef } from "react";
import DC_WARDS_GEOJSON from "../data/wardBoundaries";
import { gradeHex } from "../utils/colors";

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
    if (geom.type === "Polygon") {
      if (pointInRing([lng, lat], geom.coordinates[0])) {
        return parseInt(feature.properties.WARD);
      }
    } else if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        if (pointInRing([lng, lat], polygon[0])) {
          return parseInt(feature.properties.WARD);
        }
      }
    }
  }
  return null;
}

// Find the nearest block to a lat/lng from lazy-loaded lookup
function findNearestBlock(lat, lng, blockLookup) {
  if (!blockLookup) return null;
  let best = null;
  let bestDist = Infinity;
  for (const [block, info] of Object.entries(blockLookup)) {
    const dlat = info.lat - lat;
    const dlng = info.lng - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < bestDist) {
      bestDist = dist;
      best = { block, ...info };
    }
  }
  // Only match if within ~0.3 miles (~0.005 degrees)
  if (bestDist > 0.005 * 0.005) return null;
  return best;
}

export default function AddressSearch({ onResult, theme, resetKey }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blockResult, setBlockResult] = useState(null);
  const blockLookupRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Clear input when resetKey changes (Reset Filters clicked)
  useEffect(() => { setQuery(""); setError(""); setBlockResult(null); setSuggestions([]); setShowDropdown(false); }, [resetKey]);

  // Update suggestions when query changes
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    loadBlockLookup().then(lookup => {
      const q = query.toUpperCase();
      const matches = Object.keys(lookup).filter(address => address.includes(q)).slice(0, 10);
      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    });
  }, [query]);

  async function loadBlockLookup() {
    if (blockLookupRef.current) return blockLookupRef.current;
    const mod = await import("../data/blockLookup.json");
    blockLookupRef.current = mod.default;
    return blockLookupRef.current;
  }

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setBlockResult(null);
    try {
      const searchQuery = q.toLowerCase().includes("dc") || q.toLowerCase().includes("washington")
        ? q
        : `${q}, Washington, DC`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=us`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CSE6242-DVA-Group103-ParkingExplorer/1.0" },
      });
      if (!res.ok) {
        setError(`Geocoding error (${res.status})`);
        setLoading(false);
        return;
      }
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
        const lookup = await loadBlockLookup();
        const nearest = findNearestBlock(latF, lngF, lookup);
        setBlockResult(nearest);
        onResult({ ward, lat: latF, lng: lngF, blockInfo: nearest });
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
    if (e.key === "Escape") {
      setShowDropdown(false);
      setSuggestions([]);
    }
  }

  async function handleSelectSuggestion(address) {
    setQuery(address.replace(" BLOCK ", " "));
    setShowDropdown(false);
    setSuggestions([]);
    // Trigger search after selection
    setTimeout(async () => {
      const lookup = await loadBlockLookup();
      const blockInfo = lookup[address];
      if (blockInfo) {
        setBlockResult({ block: address, ...blockInfo });
        const ward = findWard(blockInfo.lat, blockInfo.lng);
        onResult({ ward, lat: blockInfo.lat, lng: blockInfo.lng, blockInfo });
        setError("");
      }
    }, 0);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 4, position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search address..."
            style={{
              width: "100%", background: theme.inputBg, border: `1px solid ${theme.border}`,
              borderRadius: suggestions.length > 0 ? "4px 4px 0 0" : 4, padding: "5px 8px", fontSize: 11, color: theme.text,
              outline: "none", boxSizing: "border-box", transition: "border-radius 0.2s",
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% - 1px)",
              left: 0,
              right: 0,
              minWidth: "300px",
              background: theme.inputBg,
              border: `1px solid ${theme.border}`,
              borderTop: `1px solid ${theme.border}`,
              borderRadius: "0 0 4px 4px",
              maxHeight: "300px",
              overflowY: "auto",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}>
              {suggestions.map((address, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(address)}
                  style={{
                    padding: "8px 8px",
                    fontSize: 10,
                    color: theme.text,
                    cursor: "pointer",
                    borderBottom: idx < suggestions.length - 1 ? `1px solid ${theme.border}` : "none",
                    backgroundColor: "transparent",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = theme.border}
                  onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
                >
                  {address.replace(" BLOCK ", " ")}
                </div>
              ))}
            </div>
          )}
        </div>
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
      {blockResult && (
        <div style={{ background: gradeHex(blockResult.g) + "1a", border: `1px solid ${gradeHex(blockResult.g)}66`, borderRadius: 6, padding: "6px 8px", marginTop: 2 }}>
          <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 2 }}>Nearest Block Risk</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: gradeHex(blockResult.g) }}>{blockResult.g}</span>
            <div style={{ fontSize: 10, color: theme.text, lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600 }}>{blockResult.block.replace(" BLOCK ", " ")}</div>
              <div style={{ color: theme.textMuted }}>{blockResult.t} tickets · score {(blockResult.s * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
