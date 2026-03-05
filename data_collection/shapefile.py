import pandas as pd
import geopandas as gpd
from pathlib import Path

ZCTA_SHP = "../shapefiles/cb_2018_us_zcta510_500k.shp"
ZCTA_FIELD = "ZCTA5CE10"
parking_df = pd.read_csv("../data/dc_parking_data.csv")

# only keep DC-area ZCTAs
dc_zips = {
    "20001","20002","20003","20004","20005","20006","20007","20008","20009","20010",
    "20011","20012","20015","20016","20017","20018","20019","20020","20024","20032",
    "20036","20037"
}

# Load ZCTA polygons
zctas = gpd.read_file(ZCTA_SHP)[[ZCTA_FIELD, "geometry"]].to_crs("EPSG:4326")
zctas = zctas[zctas[ZCTA_FIELD].isin(dc_zips)].copy()

# Build points from tickets dataframe
tmp = parking_df[["OBJECTID", "LATITUDE", "LONGITUDE"]].copy()

tmp["LATITUDE"] = pd.to_numeric(tmp["LATITUDE"], errors="coerce")
tmp["LONGITUDE"] = pd.to_numeric(tmp["LONGITUDE"], errors="coerce")
tmp = tmp.dropna(subset=["LATITUDE", "LONGITUDE"]).copy()

pts = gpd.GeoDataFrame(
    tmp,
    geometry=gpd.points_from_xy(tmp["LONGITUDE"], tmp["LATITUDE"]),
    crs="EPSG:4326",
)

# Spatial join
joined = gpd.sjoin(pts, zctas, how="left", predicate="within")

zip_lookup_df = (
    joined[["OBJECTID", "LATITUDE", "LONGITUDE", ZCTA_FIELD]]
    .rename(columns={ZCTA_FIELD: "ZCTA"})
    .drop_duplicates(subset=["OBJECTID"])
    .reset_index(drop=True)
)

print(zip_lookup_df.head())
print("Unmatched (no ZCTA):", int(zip_lookup_df["ZCTA"].isna().sum()))

# save for later merges
zip_lookup_df.to_csv("../data/ticket_zcta_lookup.csv", index=False)