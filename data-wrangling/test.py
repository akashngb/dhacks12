import pandas as pd

# Load your CSV
df = pd.read_csv("final_cleaned_data.csv")

# Drop one column
df = df.drop(columns=["distance_from_center","Incident_Ward","INJURY_COLLISIONS","AUTOMOBILE","PEDESTRIAN","MCI_CATEGORY_encoded","hourly_incident_rate"])

# Save back to CSV
df.to_csv("final_cleaned_data.csv", index=False)
