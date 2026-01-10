import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

# Load your data
df = pd.read_csv('final.csv')

print("=== INITIAL DATA OVERVIEW ===")
print(f"Shape: {df.shape}")
print(f"\nMissing values:\n{df.isnull().sum()}")
print(f"\nData types:\n{df.dtypes}")

# handeling date time to clean data
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

# Quarter of year
df['quarter'] = df['DATE_TIME'].dt.quarter

print("\n=== TEMPORAL FEATURES CREATED ===")

# cleaning geographic data
# Remove rows with invalid coordinates (0,0 or NaN)
df = df[~((df['LAT_R'] == 0) & (df['LON_R'] == 0))]
df = df.dropna(subset=['LAT_R', 'LON_R'])

# Round coordinates for privacy/generalization (optional)
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

# hadngeling event type specific columns
# Fill NaN based on event type
# For collision events
collision_mask = df['EVENT_TYPE'] == 'collision'
df.loc[collision_mask, 'INJURY_COLLISIONS'] = df.loc[collision_mask, 'INJURY_COLLISIONS'].fillna('NO')
df.loc[collision_mask, 'PEDESTRIAN'] = df.loc[collision_mask, 'PEDESTRIAN'].fillna('NO')
df.loc[collision_mask, 'AUTOMOBILE'] = df.loc[collision_mask, 'AUTOMOBILE'].fillna('NO')

# For crime events
crime_mask = df['EVENT_TYPE'] == 'crime'
df.loc[crime_mask, 'OFFENCE'] = df.loc[crime_mask, 'OFFENCE'].fillna('Unknown')
df.loc[crime_mask, 'MCI_CATEGORY'] = df.loc[crime_mask, 'MCI_CATEGORY'].fillna('Unknown')

# For fire events (if you have them)
fire_mask = df['EVENT_TYPE'] == 'fire'
# Add fire-specific cleaning here

print("\n=== EVENT-SPECIFIC CLEANING COMPLETE ===")


# Binary encoding for YES/NO columns
binary_cols = ['INJURY_COLLISIONS', 'PEDESTRIAN', 'AUTOMOBILE']
for col in binary_cols:
    if col in df.columns:
        df[col] = df[col].map({'YES': 1, 'NO': 0, 'yes': 1, 'no': 0})
        df[col] = df[col].fillna(0).astype(int)

# Label encode categorical variables
categorical_cols = ['EVENT_TYPE', 'OFFENCE', 'MCI_CATEGORY', 
                    'NEIGHBOURHOOD_CLEAN', 'season', 'Initial_CAD_Event_Type',
                    'Final_Incident_Type']

label_encoders = {}
for col in categorical_cols:
    if col in df.columns and df[col].dtype == 'object':
        le = LabelEncoder()
        # Handle NaN by filling with 'Unknown'
        df[col] = df[col].fillna('Unknown')
        df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
        print(f"Encoded {col}: {len(le.classes_)} unique values")

# ============================================
# 5. CREATE ADDITIONAL FEATURES
# ============================================
# Incident frequency by neighbourhood (can indicate high-risk areas)
neighbourhood_counts = df.groupby('NEIGHBOURHOOD_CLEAN').size()
df['neighbourhood_incident_count'] = df['NEIGHBOURHOOD_CLEAN'].map(neighbourhood_counts)

# Distance from city center (assuming Toronto center at ~43.65, -79.38)
toronto_center_lat, toronto_center_lon = 43.65, -79.38
df['distance_from_center'] = np.sqrt(
    (df['LAT_R'] - toronto_center_lat)**2 + 
    (df['LON_R'] - toronto_center_lon)**2
)

# Historical incident rate by time (hour of day)
# the hourly_incident_rate is mapped to approximetly -3 to +3 values ranging from how
# likely a incident is to happen or how rare it is to happen. A value of -1.47 indicates tthat approximetly 300 incidents happen around 2 am
# where as a value of 2.32 might indicated around 5000 incidents might happeing around 5pm during rush hour
hourly_counts = df.groupby('hour').size()
df['hourly_incident_rate'] = df['hour'].map(hourly_counts)

print("\n=== FEATURE ENGINEERING COMPLETE ===")

# ============================================
# 6. HANDLE REMAINING MISSING VALUES
# ============================================
# For numerical columns, impute with median
numerical_cols = df.select_dtypes(include=[np.number]).columns
imputer_num = SimpleImputer(strategy='median')
df[numerical_cols] = imputer_num.fit_transform(df[numerical_cols])

# For categorical columns, impute with mode or 'Unknown'
categorical_cols_remaining = df.select_dtypes(include=['object']).columns
for col in categorical_cols_remaining:
    df[col] = df[col].fillna('Unknown')

print("\n=== MISSING VALUE IMPUTATION COMPLETE ===")
print(f"Remaining missing values:\n{df.isnull().sum().sum()}")

# ============================================
# 7. REMOVE REDUNDANT/IRRELEVANT COLUMNS
# ============================================
# Drop original columns that have been encoded or are not useful
cols_to_drop = ['MERGE_KEY', 'DATE_TIME']  # Keep only processed versions
# Keep original categorical columns if you want to interpret results later
# Otherwise, drop them and keep only encoded versions

# Identify columns with too many unique values (might need one-hot encoding or removal)
for col in df.select_dtypes(include=['object']).columns:
    unique_count = df[col].nunique()
    if unique_count > 100:
        print(f"Warning: {col} has {unique_count} unique values - consider dropping or aggregating")

# ============================================
# 8. HANDLE IMBALANCED DATA (if classification task)
# ============================================
if 'EVENT_TYPE' in df.columns:
    print("\n=== CLASS DISTRIBUTION ===")
    print(df['EVENT_TYPE'].value_counts())
    print("\nConsider using SMOTE or class weights if doing classification!")

# ============================================
# 9. FEATURE SCALING (for ML models that need it)
# ============================================
# Identify features to scale
features_to_scale = ['LAT_R', 'LON_R', 'distance_from_center', 
                     'neighbourhood_incident_count', 'hourly_incident_rate']

scaler = StandardScaler()
df[features_to_scale] = scaler.fit_transform(df[features_to_scale])

print("\n=== FEATURE SCALING COMPLETE ===")

# ============================================
# 10. CREATE TRAIN-READY DATASET
# ============================================
# Select final features for ML
ml_features = [
    # Temporal
    'year', 'month', 'day', 'day_of_week', 'hour', 'is_weekend', 'is_night', 
    'quarter', 'season_encoded',
    
    # Geographic
    'LAT_R', 'LON_R', 'lat_zone', 'lon_zone', 'distance_from_center',
    'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
    
    # Event specific
    'EVENT_TYPE_encoded', 'INJURY_COLLISIONS', 'PEDESTRIAN', 'AUTOMOBILE',
    
    # Derived
    'hourly_incident_rate'
]

# Filter to only columns that exist
ml_features = [col for col in ml_features if col in df.columns]

df_ml_ready = df[ml_features].copy()

# ============================================
# 11. SAVE CLEANED DATA
# ============================================
df_ml_ready.to_csv('cleaned_data_ml_ready.csv', index=False)
print(f"\n✓ ML-ready dataset saved: {df_ml_ready.shape}")
print(f"Features: {df_ml_ready.columns.tolist()}")

# Save label encoders for later use (for inverse transformation)
import pickle
with open('label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print("✓ Label encoders saved to 'label_encoders.pkl'")

# Save scaler
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("✓ Scaler saved to 'scaler.pkl'")

# ============================================
# 12. DATA QUALITY REPORT
# ============================================
print("\n" + "="*50)
print("FINAL DATA QUALITY REPORT")
print("="*50)
print(f"Final shape: {df_ml_ready.shape}")
print(f"Missing values: {df_ml_ready.isnull().sum().sum()}")
print(f"Duplicate rows: {df_ml_ready.duplicated().sum()}")
print(f"\nFeature data types:")
print(df_ml_ready.dtypes.value_counts())
print(f"\nSample statistics:")
print(df_ml_ready.describe())