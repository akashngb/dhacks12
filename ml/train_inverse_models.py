import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import warnings
from datetime import datetime
warnings.filterwarnings('ignore')

np.random.seed(42)
tf.random.set_seed(42)

print("Loading data...")
df = pd.read_csv('data/final_cleaned_data.csv')

# Subtype labels
subtype_labels = {
    0: 'Collision-Other', 1: 'Collision-Injury-Pedestrian', 
    2: 'Collision-Injury-Vehicle', 3: 'Collision-NoInjury-Pedestrian', 
    4: 'Collision-NoInjury-Vehicle', 5: 'Crime-Other', 
    6: 'Crime-Assault-Simple', 7: 'Crime-Assault-Weapon-Aggravated', 
    8: 'Crime-Assault-BodilyHarm', 9: 'Crime-Assault-PeaceOfficer', 
    10: 'Crime-AutoTheft', 11: 'Crime-BreakAndEnter', 
    12: 'Crime-Robbery-Weapon', 13: 'Crime-Robbery-Business', 
    14: 'Crime-Robbery-Other', 15: 'Crime-Theft-Other', 
    16: 'Fire-Other', 17: 'Fire-Residential', 
    18: 'Fire-Vehicle', 19: 'Fire-Outdoor-Rubbish', 
    20: 'Fire-Alarm-Commercial'
}

# Reverse mapping for string to int
subtype_to_int = {v: k for k, v in subtype_labels.items()}

print(f"Dataset shape: {df.shape}")
print(f"Unique neighbourhoods: {df['NEIGHBOURHOOD_CLEAN_encoded'].nunique()}")
num_neighbourhoods = df['NEIGHBOURHOOD_CLEAN_encoded'].nunique()

# Sample for faster training during hackathon
if len(df) > 500000:
    print(f"Sampling 500k rows from {len(df)} for faster training...")
    df = df.sample(n=500000, random_state=42)

# ============================================
# MODEL 1: (datetime + location) → event_subtype
# ============================================
print("\n" + "="*60)
print("MODEL 1: Predict EVENT SUBTYPE from datetime + location")
print("="*60)

# Features: datetime + location info
X1 = df[['year', 'month', 'day', 'hour', 'day_of_week', 'is_weekend', 'is_night', 
         'quarter', 'season_encoded', 'NEIGHBOURHOOD_CLEAN_encoded', 
         'LAT_R', 'LON_R', 'lat_zone', 'lon_zone']].values

# Target: event subtype
y1 = df['EVENT_SUBTYPE_encoded'].values

X1_train, X1_test, y1_train, y1_test = train_test_split(
    X1, y1, test_size=0.2, random_state=42, stratify=y1
)

scaler1 = StandardScaler()
X1_train_scaled = scaler1.fit_transform(X1_train)
X1_test_scaled = scaler1.transform(X1_test)

print(f"Train: {X1_train_scaled.shape}, Test: {X1_test_scaled.shape}")

# Build model
model1 = models.Sequential([
    layers.Input(shape=(X1_train_scaled.shape[1],)),
    layers.Dense(256, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.4),
    layers.Dense(128, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(len(subtype_labels), activation='softmax')
])

model1.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Training Model 1...")
history1 = model1.fit(
    X1_train_scaled, y1_train,
    validation_split=0.2,
    epochs=30,
    batch_size=512,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)
    ],
    verbose=1
)

results1 = model1.evaluate(X1_test_scaled, y1_test, verbose=0)
print(f"Model 1 Test Accuracy: {results1[1]:.4f}")

# ============================================
# MODEL 2: (datetime + event_subtype) → location (neighbourhood)
# ============================================
print("\n" + "="*60)
print("MODEL 2: Predict LOCATION (neighbourhood) from datetime + event_subtype")
print("="*60)

# Features: datetime + event subtype
X2 = df[['year', 'month', 'day', 'hour', 'day_of_week', 'is_weekend', 'is_night', 
         'quarter', 'season_encoded', 'EVENT_SUBTYPE_encoded']].values

# Target: neighbourhood
y2 = df['NEIGHBOURHOOD_CLEAN_encoded'].values

X2_train, X2_test, y2_train, y2_test = train_test_split(
    X2, y2, test_size=0.2, random_state=42
)

scaler2 = StandardScaler()
X2_train_scaled = scaler2.fit_transform(X2_train)
X2_test_scaled = scaler2.transform(X2_test)

print(f"Train: {X2_train_scaled.shape}, Test: {X2_test_scaled.shape}")

# Build model
model2 = models.Sequential([
    layers.Input(shape=(X2_train_scaled.shape[1],)),
    layers.Dense(256, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.4),
    layers.Dense(128, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(num_neighbourhoods, activation='softmax')
])

model2.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Training Model 2...")
history2 = model2.fit(
    X2_train_scaled, y2_train,
    validation_split=0.2,
    epochs=30,
    batch_size=512,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)
    ],
    verbose=1
)

results2 = model2.evaluate(X2_test_scaled, y2_test, verbose=0)
print(f"Model 2 Test Accuracy: {results2[1]:.4f}")

# Calculate representative lat/lon for each neighbourhood
print("Calculating neighbourhood coordinates...")
neighbourhood_coords = df.groupby('NEIGHBOURHOOD_CLEAN_encoded').agg({
    'LAT_R': 'mean',
    'LON_R': 'mean'
}).to_dict('index')
print(f"✓ Calculated coordinates for {len(neighbourhood_coords)} neighbourhoods")

# ============================================
# MODEL 3: (location + event_subtype) → datetime (hour prediction)
# ============================================
print("\n" + "="*60)
print("MODEL 3: Predict DATETIME (hour) from location + event_subtype")
print("="*60)

# Features: location + event subtype
X3 = df[['NEIGHBOURHOOD_CLEAN_encoded', 'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
         'EVENT_SUBTYPE_encoded']].values

# Target: hour of day (0-23) - classification problem
y3 = df['hour'].values

X3_train, X3_test, y3_train, y3_test = train_test_split(
    X3, y3, test_size=0.2, random_state=42
)

scaler3 = StandardScaler()
X3_train_scaled = scaler3.fit_transform(X3_train)
X3_test_scaled = scaler3.transform(X3_test)

print(f"Train: {X3_train_scaled.shape}, Test: {X3_test_scaled.shape}")

# Build model (predicting hour as classification: 0-23)
model3 = models.Sequential([
    layers.Input(shape=(X3_train_scaled.shape[1],)),
    layers.Dense(128, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(32, activation='relu'),
    layers.Dense(24, activation='softmax')  # 24 hours
])

model3.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Training Model 3...")
history3 = model3.fit(
    X3_train_scaled, y3_train,
    validation_split=0.2,
    epochs=30,
    batch_size=512,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)
    ],
    verbose=1
)

results3 = model3.evaluate(X3_test_scaled, y3_test, verbose=0)
print(f"Model 3 Test Accuracy: {results3[1]:.4f}")

# ============================================
# SAVE EVERYTHING
# ============================================
print("\nSaving models and scalers...")

model1.save('model_datetime_location_to_subtype.keras')
model2.save('model_datetime_subtype_to_location.keras')
model3.save('model_location_subtype_to_datetime.keras')

with open('scaler_datetime_location_to_subtype.pkl', 'wb') as f:
    pickle.dump(scaler1, f)
with open('scaler_datetime_subtype_to_location.pkl', 'wb') as f:
    pickle.dump(scaler2, f)
with open('scaler_location_subtype_to_datetime.pkl', 'wb') as f:
    pickle.dump(scaler3, f)

# Save metadata
metadata = {
    'subtype_labels': subtype_labels,
    'subtype_to_int': subtype_to_int,
    'num_neighbourhoods': num_neighbourhoods,
    'neighbourhood_coords': neighbourhood_coords,
    'model1_features': ['year', 'month', 'day', 'hour', 'day_of_week', 'is_weekend', 'is_night', 
                        'quarter', 'season_encoded', 'NEIGHBOURHOOD_CLEAN_encoded', 
                        'LAT_R', 'LON_R', 'lat_zone', 'lon_zone'],
    'model2_features': ['year', 'month', 'day', 'hour', 'day_of_week', 'is_weekend', 'is_night', 
                        'quarter', 'season_encoded', 'EVENT_SUBTYPE_encoded'],
    'model3_features': ['NEIGHBOURHOOD_CLEAN_encoded', 'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
                        'EVENT_SUBTYPE_encoded']
}

with open('inverse_models_metadata.pkl', 'wb') as f:
    pickle.dump(metadata, f)

print("✓ All models saved successfully!")
print("\nModel Performance Summary:")
print(f"  Model 1 (datetime+location → event_subtype): {results1[1]:.2%} accuracy")
print(f"  Model 2 (datetime+event_subtype → location): {results2[1]:.2%} accuracy")
print(f"  Model 3 (location+event_subtype → datetime): {results3[1]:.2%} accuracy")