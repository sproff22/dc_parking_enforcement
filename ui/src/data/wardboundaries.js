// DC Ward Boundaries — simplified GeoJSON (US Census TIGER 2022)
// Replace with full-resolution file from opendata.dc.gov once
// your geopandas spatial join pipeline is complete.
const DC_WARDS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type:"Feature", properties:{ WARD:1 }, geometry:{ type:"Polygon", coordinates:[[[-77.0317,38.9100],[-77.0200,38.9100],[-77.0200,38.9400],[-77.0317,38.9400],[-77.0450,38.9350],[-77.0500,38.9200],[-77.0400,38.9100],[-77.0317,38.9100]]] } },
    { type:"Feature", properties:{ WARD:2 }, geometry:{ type:"Polygon", coordinates:[[[-77.0500,38.8900],[-77.0200,38.8900],[-77.0200,38.9100],[-77.0317,38.9100],[-77.0400,38.9100],[-77.0500,38.9100],[-77.0600,38.9050],[-77.0500,38.8900]]] } },
    { type:"Feature", properties:{ WARD:3 }, geometry:{ type:"Polygon", coordinates:[[[-77.0700,38.9200],[-77.0500,38.9200],[-77.0500,38.9100],[-77.0600,38.9050],[-77.0600,38.9400],[-77.0900,38.9500],[-77.1000,38.9300],[-77.0700,38.9200]]] } },
    { type:"Feature", properties:{ WARD:4 }, geometry:{ type:"Polygon", coordinates:[[[-77.0317,38.9400],[-77.0200,38.9400],[-77.0100,38.9600],[-77.0200,38.9700],[-77.0450,38.9700],[-77.0600,38.9600],[-77.0600,38.9400],[-77.0450,38.9350],[-77.0317,38.9400]]] } },
    { type:"Feature", properties:{ WARD:5 }, geometry:{ type:"Polygon", coordinates:[[[-77.0200,38.9100],[-76.9900,38.9100],[-76.9800,38.9300],[-77.0000,38.9600],[-77.0100,38.9600],[-77.0200,38.9400],[-77.0200,38.9100]]] } },
    { type:"Feature", properties:{ WARD:6 }, geometry:{ type:"Polygon", coordinates:[[[-77.0200,38.8900],[-76.9900,38.8900],[-76.9700,38.8950],[-76.9800,38.9300],[-76.9900,38.9100],[-77.0200,38.9100],[-77.0200,38.8900]]] } },
    { type:"Feature", properties:{ WARD:7 }, geometry:{ type:"Polygon", coordinates:[[[-76.9900,38.8900],[-76.9400,38.8900],[-76.9300,38.9000],[-76.9500,38.9300],[-76.9700,38.8950],[-76.9900,38.8900]]] } },
    { type:"Feature", properties:{ WARD:8 }, geometry:{ type:"Polygon", coordinates:[[[-77.0200,38.8500],[-76.9400,38.8500],[-76.9400,38.8900],[-76.9900,38.8900],[-77.0200,38.8900],[-77.0300,38.8700],[-77.0200,38.8500]]] } }
  ]
};

export default DC_WARDS_GEOJSON;