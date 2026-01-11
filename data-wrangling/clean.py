import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import pickle
import json

# Load your data
df = pd.read_csv('final.csv')

print("=== INITIAL DATA OVERVIEW ===")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"\nMissing values:\n{df.isnull().sum()}")
print(f"\nData types:\n{df.dtypes}")

# ============================================
# TEMPORAL FEATURES
# ============================================
df['DATE_TIME'] = pd.to_datetime(df['DATE_TIME'], errors='coerce')

# Extract temporal features
df['year'] = df['DATE_TIME'].dt.year
df['month'] = df['DATE_TIME'].dt.month
df['day'] = df['DATE_TIME'].dt.day
df['day_of_week'] = df['DATE_TIME'].dt.dayofweek  # 0=Monday, 6=Sunday
df['hour'] = df['DATE_TIME'].dt.hour
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
df['is_night'] = df['hour'].between(22, 6).astype(int)  # 10pm-6am
df['season'] = df['month'].apply(lambda x: 
    'Winter' if x in [12, 1, 2] else
    'Spring' if x in [3, 4, 5] else
    'Summer' if x in [6, 7, 8] else 'Fall'
)
df['quarter'] = df['DATE_TIME'].dt.quarter

print("\n=== TEMPORAL FEATURES CREATED ===")

# ============================================
# GEOGRAPHIC DATA CLEANING
# ============================================
# Remove rows with invalid coordinates (0,0 or NaN)
df = df[~((df['LAT_R'] == 0) & (df['LON_R'] == 0))]
df = df.dropna(subset=['LAT_R', 'LON_R'])

# Round coordinates for privacy/generalization
df['LAT_ROUNDED'] = df['LAT_R'].round(3)
df['LON_ROUNDED'] = df['LON_R'].round(3)

# Create geographic zones (simplified grid)
df['lat_zone'] = pd.cut(df['LAT_R'], bins=20, labels=False)
df['lon_zone'] = pd.cut(df['LON_R'], bins=20, labels=False)

# Clean neighbourhood names
df['NEIGHBOURHOOD_CLEAN'] = df['NEIGHBOURHOOD_CLEAN'].fillna('Unknown')
df['NEIGHBOURHOOD_CLEAN'] = df['NEIGHBOURHOOD_CLEAN'].str.strip().str.lower()

print(f"\n=== GEOGRAPHIC CLEANING ===")
print(f"Rows after coordinate cleaning: {len(df)}")
print(f"Unique neighbourhoods: {df['NEIGHBOURHOOD_CLEAN'].nunique()}")

# ============================================
# EVENT-SPECIFIC COLUMN HANDLING
# ============================================
# For collision events
collision_mask = df['EVENT_TYPE'] == 'collision'
df.loc[collision_mask, 'INJURY_COLLISIONS'] = df.loc[collision_mask, 'INJURY_COLLISIONS'].fillna('NO')
df.loc[collision_mask, 'PEDESTRIAN'] = df.loc[collision_mask, 'PEDESTRIAN'].fillna('NO')
df.loc[collision_mask, 'AUTOMOBILE'] = df.loc[collision_mask, 'AUTOMOBILE'].fillna('NO')

# For crime events
crime_mask = df['EVENT_TYPE'] == 'crime'
df.loc[crime_mask, 'OFFENCE'] = df.loc[crime_mask, 'OFFENCE'].fillna('Unknown')
df.loc[crime_mask, 'MCI_CATEGORY'] = df.loc[crime_mask, 'MCI_CATEGORY'].fillna('Unknown')

# For fire events
fire_mask = df['EVENT_TYPE'] == 'fire'
df.loc[fire_mask, 'Initial_CAD_Event_Type'] = df.loc[fire_mask, 'Initial_CAD_Event_Type'].fillna('Unknown')
df.loc[fire_mask, 'Final_Incident_Type'] = df.loc[fire_mask, 'Final_Incident_Type'].fillna('Unknown')

# Handle Incident_Ward (fill with median ward or 0 if all NaN)
if df['Incident_Ward'].notna().any():
    median_ward = df['Incident_Ward'].median()
    df['Incident_Ward'] = df['Incident_Ward'].fillna(median_ward)
else:
    df['Incident_Ward'] = 0

print("\n=== EVENT-SPECIFIC CLEANING COMPLETE ===")

# ============================================
# BINARY ENCODING FOR YES/NO COLUMNS
# ============================================
binary_cols = ['INJURY_COLLISIONS', 'PEDESTRIAN', 'AUTOMOBILE']
for col in binary_cols:
    if col in df.columns:
        df[col] = df[col].map({'YES': 1, 'NO': 0, 'yes': 1, 'no': 0, 'N/R': 0})
        df[col] = df[col].fillna(0).astype(int)

# ============================================
# ENCODE EVENT TYPE (MAIN CATEGORY)
# ============================================
print("\n=== ENCODING EVENT TYPES ===")

le_event = LabelEncoder()
df['EVENT_TYPE'] = df['EVENT_TYPE'].fillna('Unknown')
df['EVENT_TYPE_encoded'] = le_event.fit_transform(df['EVENT_TYPE'].astype(str))

print(f"\nEVENT_TYPE Mapping:")
for i, label in enumerate(le_event.classes_):
    print(f"  {i} → {label}")

# ============================================
# CREATE GROUPED SUB-CATEGORIES (0-20 RANGE)
# ============================================
print("\n=== CREATING GROUPED EVENT SUB-CATEGORIES (0-20) ===")

df['EVENT_SUBTYPE_encoded'] = 0

# ========== COLLISION SUBTYPES (0-4) ==========
collision_rows = df['EVENT_TYPE'] == 'collision'

# 0 = Other collision (default)
df.loc[collision_rows, 'EVENT_SUBTYPE_encoded'] = 0

# 1 = Injury + Pedestrian
mask = collision_rows & (df['INJURY_COLLISIONS'] == 1) & (df['PEDESTRIAN'] == 1)
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 1

# 2 = Injury + Vehicle (no pedestrian)
mask = collision_rows & (df['INJURY_COLLISIONS'] == 1) & (df['PEDESTRIAN'] == 0) & (df['AUTOMOBILE'] == 1)
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 2

# 3 = No Injury + Pedestrian
mask = collision_rows & (df['INJURY_COLLISIONS'] == 0) & (df['PEDESTRIAN'] == 1)
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 3

# 4 = No Injury + Vehicle
mask = collision_rows & (df['INJURY_COLLISIONS'] == 0) & (df['AUTOMOBILE'] == 1)
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 4

# ========== CRIME SUBTYPES (5-15) ==========
crime_rows = df['EVENT_TYPE'] == 'crime'

# 5 = Other crime (default)
df.loc[crime_rows, 'EVENT_SUBTYPE_encoded'] = 5

# 6 = Assault (simple)
mask = crime_rows & (df['OFFENCE'].str.contains('Assault', case=False, na=False)) & \
       ~(df['OFFENCE'].str.contains('Weapon|Bodily|Peace|Resist|Administering|Aggravated|Disarming|Discharge|Pointing|Use Firearm|Force/Thrt', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 6

# 7 = Assault with Weapon / Aggravated / Discharge Firearm
mask = crime_rows & (df['OFFENCE'].str.contains('Assault.*Weapon|Aggravated|Discharge|Pointing|Use Firearm', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 7

# 8 = Assault Bodily Harm
mask = crime_rows & (df['OFFENCE'].str.contains('Assault.*Bodily|Administering Noxious', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 8

# 9 = Assault Peace Officer / Resist / Disarming
mask = crime_rows & (df['OFFENCE'].str.contains('Peace Officer|Resist|Disarming|Force/Thrt', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 9

# 10 = Theft of Motor Vehicle (Auto Theft)
mask = crime_rows & (df['OFFENCE'].str.contains('Theft Of Motor Vehicle|Auto Theft|Vehicle Jacking', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 10

# 11 = Break and Enter (B&E)
mask = crime_rows & (df['OFFENCE'].str.contains('B&E|Break|Unlawfully In Dwelling', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 11

# 12 = Robbery with Weapon
mask = crime_rows & (df['OFFENCE'].str.contains('Robbery.*Weapon', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 12

# 13 = Robbery - Business/Financial
mask = crime_rows & (df['OFFENCE'].str.contains('Robbery.*Business|Robbery.*Financial', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 13

# 14 = Robbery - Other (Mugging/Swarming/Purse Snatch/Other)
mask = crime_rows & (df['OFFENCE'].str.contains('Robbery', case=False, na=False)) & \
       (df['EVENT_SUBTYPE_encoded'] == 5)  # Not already categorized
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 14

# 15 = Theft Over / Other Theft
mask = crime_rows & (df['OFFENCE'].str.contains('Theft', case=False, na=False)) & \
       ~(df['OFFENCE'].str.contains('Motor Vehicle', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 15

# ========== FIRE SUBTYPES (16-20) ==========
fire_rows = df['EVENT_TYPE'] == 'fire'

# 16 = Other fire (default)
df.loc[fire_rows, 'EVENT_SUBTYPE_encoded'] = 16

# 17 = Residential Fire
mask = fire_rows & (df['Initial_CAD_Event_Type'].str.contains('Residential|FIHR', case=False, na=False) | 
                    df['Final_Incident_Type'].str.contains('Residential', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 17

# 18 = Vehicle Fire
mask = fire_rows & (df['Initial_CAD_Event_Type'].str.contains('Vehicle|VEF', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 18

# 19 = Outdoor/Grass/Rubbish/No Loss Fire
mask = fire_rows & ((df['Final_Incident_Type'].str.contains('OUTDOOR|NO LOSS', case=False, na=False)) |
                    (df['Initial_CAD_Event_Type'].str.contains('Grass|Rubbish|FIG|FIR', case=False, na=False)))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 19

# 20 = Alarm/High-rise/Commercial/Industrial
mask = fire_rows & (df['Initial_CAD_Event_Type'].str.contains('Alarm|Highrise|FICI|Commercial|Industrial|Medical|Trouble Breathing', case=False, na=False))
df.loc[mask, 'EVENT_SUBTYPE_encoded'] = 20

# Create readable labels for reference
subtype_labels = {
    0: 'Collision-Other',
    1: 'Collision-Injury-Pedestrian',
    2: 'Collision-Injury-Vehicle',
    3: 'Collision-NoInjury-Pedestrian',
    4: 'Collision-NoInjury-Vehicle',
    5: 'Crime-Other',
    6: 'Crime-Assault-Simple',
    7: 'Crime-Assault-Weapon-Aggravated',
    8: 'Crime-Assault-BodilyHarm',
    9: 'Crime-Assault-PeaceOfficer',
    10: 'Crime-AutoTheft',
    11: 'Crime-BreakAndEnter',
    12: 'Crime-Robbery-Weapon',
    13: 'Crime-Robbery-Business',
    14: 'Crime-Robbery-Other',
    15: 'Crime-Theft-Other',
    16: 'Fire-Other',
    17: 'Fire-Residential',
    18: 'Fire-Vehicle',
    19: 'Fire-Outdoor-Rubbish',
    20: 'Fire-Alarm-Commercial'
}

df['EVENT_SUBTYPE_label'] = df['EVENT_SUBTYPE_encoded'].map(subtype_labels)

print("\n=== EVENT SUBTYPE DISTRIBUTION ===")
print("\nCOLLISION Subtypes (0-4):")
for i in range(0, 5):
    count = (df['EVENT_SUBTYPE_encoded'] == i).sum()
    print(f"  {i}: {subtype_labels[i]:40s} → {count:,} incidents")

print("\nCRIME Subtypes (5-15):")
for i in range(5, 16):
    count = (df['EVENT_SUBTYPE_encoded'] == i).sum()
    print(f"  {i}: {subtype_labels[i]:40s} → {count:,} incidents")

print("\nFIRE Subtypes (16-20):")
for i in range(16, 21):
    count = (df['EVENT_SUBTYPE_encoded'] == i).sum()
    print(f"  {i}: {subtype_labels[i]:40s} → {count:,} incidents")

# ============================================
# ENCODE OTHER CATEGORICAL VARIABLES
# ============================================
categorical_cols = ['NEIGHBOURHOOD_CLEAN', 'season', 'MCI_CATEGORY']

label_encoders = {
    'EVENT_TYPE': le_event
}

for col in categorical_cols:
    if col in df.columns and df[col].dtype == 'object':
        le = LabelEncoder()
        df[col] = df[col].fillna('Unknown')
        df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
        print(f"Encoded {col}: {len(le.classes_)} unique values")

# ============================================
# CREATE ADDITIONAL FEATURES
# ============================================
# Incident frequency by neighbourhood
neighbourhood_counts = df.groupby('NEIGHBOURHOOD_CLEAN').size()
df['neighbourhood_incident_count'] = df['NEIGHBOURHOOD_CLEAN'].map(neighbourhood_counts)

# Distance from city center (Toronto center at ~43.65, -79.38)
toronto_center_lat, toronto_center_lon = 43.65, -79.38
df['distance_from_center'] = np.sqrt(
    (df['LAT_R'] - toronto_center_lat)**2 + 
    (df['LON_R'] - toronto_center_lon)**2
)

# Historical incident rate by time
hourly_counts = df.groupby('hour').size()
df['hourly_incident_rate'] = df['hour'].map(hourly_counts)

print("\n=== FEATURE ENGINEERING COMPLETE ===")

# ============================================
# HANDLE REMAINING MISSING VALUES
# ============================================
# For numerical columns, impute with median
numerical_cols = df.select_dtypes(include=[np.number]).columns
imputer_num = SimpleImputer(strategy='median')
df[numerical_cols] = imputer_num.fit_transform(df[numerical_cols])

# For categorical columns, impute with 'Unknown'
categorical_cols_remaining = df.select_dtypes(include=['object']).columns
for col in categorical_cols_remaining:
    df[col] = df[col].fillna('Unknown')

print("\n=== MISSING VALUE IMPUTATION COMPLETE ===")
print(f"Remaining missing values: {df.isnull().sum().sum()}")

# ============================================
# CLASS DISTRIBUTION
# ============================================
print("\n=== CLASS DISTRIBUTION ===")
print("\nMain Event Types:")
print(df['EVENT_TYPE'].value_counts())
print("\nEvent Subtypes Distribution:")
print(df['EVENT_SUBTYPE_encoded'].value_counts().sort_index())

# ============================================
# FEATURE SCALING
# ============================================
# Only scale continuous geographic features
features_to_scale = ['LAT_R', 'LON_R', 'distance_from_center']

scaler = StandardScaler()
df[features_to_scale] = scaler.fit_transform(df[features_to_scale])

print("\n=== FEATURE SCALING COMPLETE ===")

# ============================================
# CREATE TRAIN-READY DATASET
# ============================================
ml_features = [
    # Temporal
    'year', 'month', 'day', 'day_of_week', 'hour', 'is_weekend', 'is_night', 
    'quarter', 'season_encoded',
    
    # Geographic
    'LAT_R', 'LON_R', 'lat_zone', 'lon_zone', 'distance_from_center',
    'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
    'Incident_Ward',
    
    # Event type (hierarchical)
    'EVENT_TYPE_encoded',        # Main: 0=collision, 1=crime, 2=fire
    'EVENT_SUBTYPE_encoded',     # Grouped sub-category: 0-20
    
    # Event specific details
    'INJURY_COLLISIONS', 'PEDESTRIAN', 'AUTOMOBILE',
    'MCI_CATEGORY_encoded',
    
    # Derived
    'hourly_incident_rate'
]

# Filter to only columns that exist
ml_features = [col for col in ml_features if col in df.columns]

df_ml_ready = df[ml_features].copy()

# ============================================
# SAVE CLEANED DATA
# ============================================
df_ml_ready.to_csv('cleaned_data_ml_ready.csv', index=False)
print(f"\n✓ ML-ready dataset saved: {df_ml_ready.shape}")
print(f"Features ({len(ml_features)}): {ml_features}")

# Save label encoders
with open('label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print("✓ Label encoders saved to 'label_encoders.pkl'")

# Save scaler
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("✓ Scaler saved to 'scaler.pkl'")

# ============================================
# SAVE MAPPINGS
# ============================================
# Save the subtype mapping
with open('event_subtype_mapping.json', 'w') as f:
    json.dump(subtype_labels, f, indent=2)
print("✓ Event subtype mapping saved to 'event_subtype_mapping.json'")

# Save all encodings
mappings = {
    'EVENT_SUBTYPE': subtype_labels
}
for col_name, encoder in label_encoders.items():
    mappings[col_name] = dict(zip(
        range(len(encoder.classes_)), 
        encoder.classes_.tolist()
    ))

with open('encodings_reference.json', 'w') as f:
    json.dump(mappings, f, indent=2)
print("✓ All encodings saved to 'encodings_reference.json'")

# Create reference table
event_ref = df[['EVENT_TYPE', 'EVENT_TYPE_encoded', 'EVENT_SUBTYPE_label', 'EVENT_SUBTYPE_encoded']].drop_duplicates()
event_ref = event_ref.sort_values(['EVENT_TYPE_encoded', 'EVENT_SUBTYPE_encoded'])
event_ref.to_csv('event_type_reference.csv', index=False)
print("✓ Event type reference saved to 'event_type_reference.csv'")

# ============================================
# FINAL REPORT
# ============================================
print("\n" + "="*70)
print("FINAL DATA QUALITY REPORT")
print("="*70)
print(f"Final shape: {df_ml_ready.shape}")
print(f"Missing values: {df_ml_ready.isnull().sum().sum()}")
print(f"Duplicate rows: {df_ml_ready.duplicated().sum()}")
print(f"\nFeature data types:")
print(df_ml_ready.dtypes.value_counts())
print(f"\nFeature list ({len(ml_features)} total):")
for i, feat in enumerate(ml_features, 1):
    print(f"  {i:2d}. {feat}")
print(f"\nSample statistics:")
print(df_ml_ready.describe())

print("\n" + "="*70)
print("EVENT ENCODING SUMMARY")
print("="*70)
print(f"Main event types: {df['EVENT_TYPE'].nunique()} (encoded 0-2)")
print(f"Event subtypes: 21 grouped categories (encoded 0-20)")
print(f"\nHierarchical structure:")
print(f"  Level 1: EVENT_TYPE_encoded")
print(f"    0 = collision (subtypes 0-4)")
print(f"    1 = crime (subtypes 5-15)")
print(f"    2 = fire (subtypes 16-20)")
print(f"  Level 2: EVENT_SUBTYPE_encoded (0-20)")
print(f"\n✓ All fields captured and processed successfully!")
print("="*70)