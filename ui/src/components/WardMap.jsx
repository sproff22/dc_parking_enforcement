import { useState, useEffect, useRef } from "react";
import DC_WARDS_GEOJSON from "../data/wardBoundaries";
import ZIP_BOUNDARIES from "../data/zipBoundaries.json";
import { wardColor, riskHex, riskLabel, riskGrade } from "../utils/colors";
import { fmt, pct, usdK } from "../utils/formatters";

export default function WardMap({ activeWard, onWardClick, colorMode, minRisk, theme, showZips, filteredStats, searchPin }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layersRef    = useRef({});
  const tileLayerRef = useRef(null);
  const zipLayerRef  = useRef(null);
  const pinRef       = useRef(null);
  const statsRef     = useRef(filteredStats);
  const colorModeRef = useRef(colorMode);
  const minRiskRef   = useRef(minRisk);
  const activeWardRef = useRef(activeWard);
  const [ready, setReady] = useState(false);
  statsRef.current = filteredStats;
  colorModeRef.current = colorMode;
  minRiskRef.current = minRisk;
  activeWardRef.current = activeWard;
  
  const overlayS = { position:"absolute",inset:0,zIndex:1000,background:theme.overlayBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8 };
  const spinS    = { width:28,height:28,border:`3px solid ${theme.spinBorder}`,borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin 0.8s linear infinite" };

  function styleFor(wardNum, selected) {
    const st  = statsRef.current;
    const s   = st[wardNum];
    const mr  = minRiskRef.current;
    const cm  = colorModeRef.current;
    const dim = s && s.riskScore < mr;
    const col = dim ? theme.wardDim : wardColor(st, wardNum, cm);
    return {
      fillColor:   col,
      fillOpacity: dim ? 0.3 : selected === wardNum ? 0.88 : 0.65,
      color:       selected === wardNum ? theme.wardBorderSelected : theme.wardBorder,
      weight:      selected === wardNum ? 2.5 : 1,
    };
  }

  function popupHTML(wn) {
    const s = statsRef.current[wn];
    if (!s) return `<b>Ward ${wn}</b>`;
    return `<div style="font:12px/1.75 system-ui;min-width:155px">
      <b style="font-size:13px">Ward ${wn}</b><br/>
      Grade: <b style="color:${riskHex(s.riskScore)};font-size:15px">${riskGrade(s.riskScore)}</b> <span style="color:#64748b;font-size:11px">(${(s.riskScore*100).toFixed(0)}%)</span><br/>
      Citations: <b>${fmt(s.citations)}</b><br/>
      Median income: <b>${usdK(s.medianIncome)}</b><br/>
      Poverty rate: <b>${pct(s.povertyRate)}</b><br/>
      Top violation: <b>${s.topViolation}</b>
    </div>`;
  }

  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(l);
    }

    function boot(L) {
      if (mapRef.current) return;
      const map = L.map(containerRef.current, { center:[38.9,-77.02], zoom:11, zoomControl:true });
      const tileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${theme.tilemap}/{z}/{x}/{y}{r}.png`, {
        attribution:"(c) CARTO", subdomains:"abcd", maxZoom:19,
      }).addTo(map);
      mapRef.current = map;
      tileLayerRef.current = tileLayer;

      const geoLayer = L.geoJSON(DC_WARDS_GEOJSON, {
        style: f => styleFor(f.properties.WARD, activeWard),
        onEachFeature: (f, layer) => {
          const wn = f.properties.WARD;
          layersRef.current[wn] = { layer, feature: f };
          layer.on("click", () => onWardClick(wn));
          layer.on("mouseover", function(e) {
            // Never change fill color on hover — only increase border weight
            this.setStyle({ weight: 3 });
            L.popup({ closeButton:false, className:"wpop" })
              .setLatLng(e.latlng).setContent(popupHTML(wn)).openOn(map);
          });
          layer.on("mouseout", function() {
            this.setStyle(styleFor(wn, activeWardRef.current));
            map.closePopup();
          });
        },
      }).addTo(map);

      map.fitBounds(geoLayer.getBounds(), { padding:[10,10] });
      setReady(true);
    }

    if (window.L) boot(window.L);
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = () => boot(window.L);
      document.head.appendChild(s);
    }
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!ready || !mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = window.L.tileLayer(`https://{s}.basemaps.cartocdn.com/${theme.tilemap}/{z}/{x}/{y}{r}.png`, {
      attribution:"(c) CARTO", subdomains:"abcd", maxZoom:19,
    }).addTo(mapRef.current);
  }, [theme.tilemap, ready]);

  useEffect(() => {
    if (!ready) return;
    Object.entries(layersRef.current).forEach(([wn, { layer }]) => {
      layer.setStyle(styleFor(parseInt(wn), activeWard));
    });
  }, [colorMode, activeWard, minRisk, filteredStats, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (activeWard && layersRef.current[activeWard]) {
      mapRef.current.fitBounds(layersRef.current[activeWard].layer.getBounds(), { padding:[40,40] });
    } else if (!activeWard) {
      const allBounds = Object.values(layersRef.current)
        .reduce((b, { layer }) => b.extend(layer.getBounds()), window.L.latLngBounds());
      if (allBounds.isValid()) mapRef.current.fitBounds(allBounds, { padding:[10,10] });
    }
  }, [activeWard, ready]);

  // Show/hide search pin marker
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = window.L;
    if (pinRef.current) { pinRef.current.remove(); pinRef.current = null; }
    if (searchPin) {
      const icon = L.divIcon({
        className: "",
        html: '<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444"/><circle cx="12" cy="12" r="5" fill="white"/></svg>',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      });
      pinRef.current = L.marker([searchPin.lat, searchPin.lng], { icon })
        .addTo(mapRef.current);
      mapRef.current.setView([searchPin.lat, searchPin.lng], 14);
    }
  }, [searchPin, ready]);

  // Toggle zip code boundaries
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = window.L;
    if (zipLayerRef.current) { zipLayerRef.current.remove(); zipLayerRef.current = null; }
    if (showZips) {
      zipLayerRef.current = L.geoJSON(ZIP_BOUNDARIES, {
        style: () => ({
          fillColor: "transparent",
          fillOpacity: 0,
          color: theme.textMuted,
          weight: 1.5,
          dashArray: "4 4",
        }),
        onEachFeature: (f, layer) => {
          const zip = f.properties.ZIPCODE || f.properties.ZIP_CODE_TEXT;
          layer.on("mouseover", function(e) {
            this.setStyle({ weight: 2.5, color: "#3b82f6" });
            L.popup({ closeButton:false, className:"wpop" })
              .setLatLng(e.latlng).setContent(`<b>Zip ${zip}</b>`).openOn(mapRef.current);
          });
          layer.on("mouseout", function() {
            this.setStyle({ weight: 1.5, color: theme.textMuted });
            mapRef.current.closePopup();
          });
        },
      }).addTo(mapRef.current);
    }
  }, [showZips, ready, theme.textMuted]);

  return (
    <div style={{ position:"relative", flex:1, minHeight:0, borderRadius:10, overflow:"hidden", border:`1px solid ${theme.mapBorder}` }}>
      {!ready && (
        <div style={overlayS}>
          <div style={spinS} />
          <span style={{ color:theme.textMuted, fontSize:12 }}>Loading map...</span>
        </div>
      )}
      <div ref={containerRef} style={{ width:"100%", height:"100%" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .wpop .leaflet-popup-content-wrapper{background:${theme.popupBg};color:${theme.popupText};border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);border:1px solid ${theme.popupBorder}} .wpop .leaflet-popup-tip{background:${theme.popupBg}} .wpop .leaflet-popup-content{margin:10px 12px}`}</style>
    </div>
  );
}
