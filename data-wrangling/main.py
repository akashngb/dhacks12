import pandas as pd


fire = pd.read_csv("data/fire_data.csv")
crime = pd.read_csv("data/crime_data.csv")
collision = pd.read_csv("data/collision_data.csv")

print(len(fire),len(crime),len(collision))



# renaming long and lat columsn
fire = fire.rename(columns={
    "Latitude": "LAT",
    "Longitude": "LON"
})

crime = crime.rename(columns={
    "LAT_WGS84": "LAT",
    "LONG_WGS84": "LON"
})

collision = collision.rename(columns={
    "LAT_WGS84": "LAT",
    "LONG_WGS84": "LON"
})

# cleaning neightbourhood data if present, uses regular expressions
def clean_neighbourhood(col):
    return (
        col.astype(str)
           .str.lower()
           .str.strip()
           .str.replace(r"\(\d+\)", "", regex=True)
           .str.replace("  ", " ", regex=False)
    )

# fire doesn't always have neighbourhood, so guard it
if "NEIGHBOURHOOD_158" in crime.columns:
    crime["NEIGHBOURHOOD_CLEAN"] = clean_neighbourhood(crime["NEIGHBOURHOOD_158"])

if "NEIGHBOURHOOD_158" in collision.columns:
    collision["NEIGHBOURHOOD_CLEAN"] = clean_neighbourhood(collision["NEIGHBOURHOOD_158"])

# rounding coordinates
for df in [fire, crime, collision]:
    df["LAT_R"] = pd.to_numeric(df["LAT"], errors="coerce").round(4)
    df["LON_R"] = pd.to_numeric(df["LON"], errors="coerce").round(4)

# have a general time
fire["DATE_TIME"] = pd.to_datetime(fire["TFS_Alarm_Time"], errors="coerce")
crime["DATE_TIME"] = pd.to_datetime(crime["OCC_DATE"], errors="coerce")
collision["DATE_TIME"] = pd.to_datetime(collision["OCC_DATE"], errors="coerce")

# format uniformly
for df in [fire, crime, collision]:
    df["DATE_TIME"] = df["DATE_TIME"].dt.strftime("%Y-%m-%d %H:%M:%S")

# =========================
# 6. ADD EVENT TYPE LABEL
# =========================
fire["EVENT_TYPE"] = "fire"
crime["EVENT_TYPE"] = "crime"
collision["EVENT_TYPE"] = "collision"

# =========================
# 7. BUILD MERGE KEY
# =========================
for df in [fire, crime, collision]:
    df["MERGE_KEY"] = (
        df["LAT_R"].astype(str)
        + "_" +
        df["LON_R"].astype(str)
    )

# =========================
# 8. SELECT CORE FIELDS
# =========================
fire_core = fire[[
    "MERGE_KEY","LAT_R","LON_R","DATE_TIME","EVENT_TYPE",
    "Initial_CAD_Event_Type","Final_Incident_Type","Incident_Ward"
]]

crime_core = crime[[
    "MERGE_KEY","LAT_R","LON_R","DATE_TIME","EVENT_TYPE",
    "OFFENCE","MCI_CATEGORY","NEIGHBOURHOOD_CLEAN"
]]

collision_core = collision[[
    "MERGE_KEY","LAT_R","LON_R","DATE_TIME","EVENT_TYPE",
    "INJURY_COLLISIONS","PEDESTRIAN","AUTOMOBILE","NEIGHBOURHOOD_CLEAN"
]]


# appending things together
combined = pd.concat([fire_core, crime_core, collision_core], ignore_index=True)

# clean non valid coordiates
combined = combined.dropna(subset=["LAT_R","LON_R"])

# remove (0,0) junk
combined = combined[(combined["LAT_R"] != 0) & (combined["LON_R"] != 0)]

# save final files
combined.to_csv("final.csv", index=False)

print("Finished. Rows:", len(combined))
