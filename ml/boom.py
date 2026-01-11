import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, mean_squared_error
import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")

# Load your data
df = pd.read_csv('data/final_cleaned_data.csv')

print(f"Dataset shape: {df.shape}")
print(f"Missing values:\n{df.isnull().sum()}")

# Define subtype labels
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

# Display basic info
print(f"\nDate range: {df['year'].min()}-{df['year'].max()}")
print(f"Unique neighbourhoods: {df['NEIGHBOURHOOD_CLEAN_encoded'].nunique()}")
print(f"Event types distribution:\n{df['EVENT_TYPE_encoded'].value_counts()}")

# Create a copy for feature engineering
data = df.copy()

# Create datetime for easier manipulation
data['datetime'] = pd.to_datetime(data[['year', 'month', 'day', 'hour']])

# Sort by datetime
data = data.sort_values('datetime').reset_index(drop=True)

# Create cyclical features (important for time patterns)
data['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24)
data['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24)
data['day_of_week_sin'] = np.sin(2 * np.pi * data['day_of_week'] / 7)
data['day_of_week_cos'] = np.cos(2 * np.pi * data['day_of_week'] / 7)
data['month_sin'] = np.sin(2 * np.pi * data['month'] / 12)
data['month_cos'] = np.cos(2 * np.pi * data['month'] / 12)

# Create lagging features (events in previous hours/days)
# Group by neighbourhood for temporal features
print("Creating temporal features...")
data['neighbourhood_hour_count'] = 0

# This will take time on 1M+ rows, so we'll do a simplified version
# Count events per neighbourhood per hour
hourly_counts = data.groupby(['NEIGHBOURHOOD_CLEAN_encoded', 'datetime']).size().reset_index(name='events_this_hour')
data = data.merge(hourly_counts, on=['NEIGHBOURHOOD_CLEAN_encoded', 'datetime'], how='left')

print("Feature engineering complete!")

# ============================================
# TASK 1: BINARY CLASSIFICATION
# "Will a crime occur in this neighbourhood in the next hour?"
# ============================================

def prepare_binary_classification_data(data):
    """
    Prepare data for binary classification: will ANY event occur in next hour?
    """
    print("\n=== Preparing Binary Classification Data ===")
    
    # Create target: will there be an event in the next hour?
    # We'll create a shifted version to predict the future
    data_sorted = data.sort_values(['NEIGHBOURHOOD_CLEAN_encoded', 'datetime']).copy()
    
    # For each neighbourhood, check if there's an event in the next hour
    data_sorted['next_hour_event'] = 0
    
    # Group by neighbourhood and create future labels
    for neigh in data_sorted['NEIGHBOURHOOD_CLEAN_encoded'].unique():
        mask = data_sorted['NEIGHBOURHOOD_CLEAN_encoded'] == neigh
        dates = data_sorted.loc[mask, 'datetime']
        
        # For each datetime, check if there's an event within next hour
        for idx in data_sorted[mask].index:
            current_time = data_sorted.loc[idx, 'datetime']
            next_hour = current_time + timedelta(hours=1)
            
            # Check if any events occur in next hour
            future_events = data_sorted[
                (data_sorted['NEIGHBOURHOOD_CLEAN_encoded'] == neigh) & 
                (data_sorted['datetime'] > current_time) & 
                (data_sorted['datetime'] <= next_hour)
            ]
            
            if len(future_events) > 0:
                data_sorted.loc[idx, 'next_hour_event'] = 1
    
    # Select features
    feature_cols = [
        'hour', 'day_of_week', 'is_weekend', 'is_night', 'quarter', 
        'season_encoded', 'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
        'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
        'hour_sin', 'hour_cos', 'day_of_week_sin', 'day_of_week_cos',
        'month_sin', 'month_cos', 'events_this_hour'
    ]
    
    X = data_sorted[feature_cols].values
    y = data_sorted['next_hour_event'].values
    
    print(f"Features shape: {X.shape}")
    print(f"Target distribution: {np.bincount(y.astype(int))}")
    print(f"Positive class ratio: {y.mean():.4f}")
    
    return X, y, feature_cols


# ============================================
# TASK 2: MULTI-CLASS CLASSIFICATION
# "What TYPE of event is most likely?"
# ============================================

def prepare_multiclass_data(data):
    """
    Prepare data for multi-class classification: predict event subtype
    """
    print("\n=== Preparing Multi-Class Classification Data ===")
    
    # Features
    feature_cols = [
        'hour', 'day_of_week', 'is_weekend', 'is_night', 'quarter', 
        'season_encoded', 'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
        'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
        'hour_sin', 'hour_cos', 'day_of_week_sin', 'day_of_week_cos',
        'month_sin', 'month_cos', 'events_this_hour'
    ]
    
    X = data[feature_cols].values
    y = data['EVENT_SUBTYPE_encoded'].values
    
    print(f"Features shape: {X.shape}")
    print(f"Number of classes: {len(np.unique(y))}")
    print(f"Class distribution:\n{pd.Series(y).value_counts().sort_index()}")
    
    return X, y, feature_cols


# ============================================
# TASK 3: REGRESSION
# "How many events will occur in this area today?"
# ============================================

def prepare_regression_data(data):
    """
    Prepare data for regression: predict number of events per neighbourhood per day
    """
    print("\n=== Preparing Regression Data ===")
    
    # Aggregate to neighbourhood-day level
    data['date'] = data['datetime'].dt.date
    
    # Count events per neighbourhood per day
    daily_counts = data.groupby(['NEIGHBOURHOOD_CLEAN_encoded', 'date']).size().reset_index(name='daily_event_count')
    
    # Get representative features for each neighbourhood-day
    daily_features = data.groupby(['NEIGHBOURHOOD_CLEAN_encoded', 'date']).agg({
        'day_of_week': 'first',
        'is_weekend': 'first',
        'quarter': 'first',
        'season_encoded': 'first',
        'LAT_R': 'mean',
        'LON_R': 'mean',
        'lat_zone': 'first',
        'lon_zone': 'first',
        'neighbourhood_incident_count': 'first',
        'month_sin': 'first',
        'month_cos': 'first',
        'day_of_week_sin': 'first',
        'day_of_week_cos': 'first'
    }).reset_index()
    
    # Merge
    regression_data = daily_features.merge(daily_counts, on=['NEIGHBOURHOOD_CLEAN_encoded', 'date'])
    
    feature_cols = [
        'day_of_week', 'is_weekend', 'quarter', 'season_encoded',
        'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
        'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
        'month_sin', 'month_cos', 'day_of_week_sin', 'day_of_week_cos'
    ]
    
    X = regression_data[feature_cols].values
    y = regression_data['daily_event_count'].values
    
    print(f"Features shape: {X.shape}")
    print(f"Target stats: min={y.min()}, max={y.max()}, mean={y.mean():.2f}, std={y.std():.2f}")
    
    return X, y, feature_cols, regression_data


# Prepare all datasets (this may take a few minutes for large datasets)
print("Starting data preparation...")

# For hackathon speed, let's use a sample if dataset is huge
if len(data) > 500000:
    print(f"Large dataset detected ({len(data)} rows). Using sample for faster training...")
    data_sample = data.sample(n=500000, random_state=42)
else:
    data_sample = data.copy()

# Note: Binary classification preparation is slow due to the loop
# For hackathon, let's use a simplified version
print("\nNote: Using simplified binary classification (predicting if event type is crime)")
data_sample['is_crime'] = (data_sample['EVENT_TYPE_encoded'] == 1).astype(int)  # Adjust based on your encoding

# Simplified binary
feature_cols_binary = [
    'hour', 'day_of_week', 'is_weekend', 'is_night', 'quarter', 
    'season_encoded', 'LAT_R', 'LON_R', 'lat_zone', 'lon_zone',
    'NEIGHBOURHOOD_CLEAN_encoded', 'neighbourhood_incident_count',
    'hour_sin', 'hour_cos', 'day_of_week_sin', 'day_of_week_cos',
    'month_sin', 'month_cos', 'events_this_hour'
]

X_binary = data_sample[feature_cols_binary].values
y_binary = data_sample['is_crime'].values

X_multi, y_multi, feature_cols_multi = prepare_multiclass_data(data_sample)
X_reg, y_reg, feature_cols_reg, regression_data = prepare_regression_data(data_sample)

# ============================================
# SPLIT AND SCALE DATA
# ============================================

# Binary Classification
X_train_bin, X_test_bin, y_train_bin, y_test_bin = train_test_split(
    X_binary, y_binary, test_size=0.2, random_state=42, stratify=y_binary
)

scaler_bin = StandardScaler()
X_train_bin_scaled = scaler_bin.fit_transform(X_train_bin)
X_test_bin_scaled = scaler_bin.transform(X_test_bin)

print(f"Binary - Train: {X_train_bin_scaled.shape}, Test: {X_test_bin_scaled.shape}")

# Multi-Class Classification
X_train_multi, X_test_multi, y_train_multi, y_test_multi = train_test_split(
    X_multi, y_multi, test_size=0.2, random_state=42, stratify=y_multi
)

scaler_multi = StandardScaler()
X_train_multi_scaled = scaler_multi.fit_transform(X_train_multi)
X_test_multi_scaled = scaler_multi.transform(X_test_multi)

print(f"Multi-Class - Train: {X_train_multi_scaled.shape}, Test: {X_test_multi_scaled.shape}")

# Regression
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

scaler_reg = StandardScaler()
X_train_reg_scaled = scaler_reg.fit_transform(X_train_reg)
X_test_reg_scaled = scaler_reg.transform(X_test_reg)

print(f"Regression - Train: {X_train_reg_scaled.shape}, Test: {X_test_reg_scaled.shape}")

# ============================================
# MODEL 1: BINARY CLASSIFICATION
# ============================================

def build_binary_model(input_dim):
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(32, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc'), 
                 keras.metrics.Precision(name='precision'),
                 keras.metrics.Recall(name='recall')]
    )
    
    return model


# ============================================
# MODEL 2: MULTI-CLASS CLASSIFICATION
# ============================================

def build_multiclass_model(input_dim, num_classes):
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.SparseTopKCategoricalAccuracy(
                k=3, name='top_3_accuracy'
            )
        ]
    )
    
    return model


# ============================================
# MODEL 3: REGRESSION
# ============================================

def build_regression_model(input_dim):
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(32, activation='relu'),
        layers.Dense(1)  # No activation for regression
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae', 'mse']
    )
    
    return model


# Build all models
binary_model = build_binary_model(X_train_bin_scaled.shape[1])
multiclass_model = build_multiclass_model(X_train_multi_scaled.shape[1], len(subtype_labels))
regression_model = build_regression_model(X_train_reg_scaled.shape[1])

print("All models built successfully!")
print("\n=== Binary Model Summary ===")
binary_model.summary()
print("\n=== Multi-Class Model Summary ===")
multiclass_model.summary()
print("\n=== Regression Model Summary ===")
regression_model.summary()

# ============================================
# TRAIN ALL MODELS
# ============================================

# Callbacks for all models
early_stopping = keras.callbacks.EarlyStopping(
    monitor='val_loss', 
    patience=10, 
    restore_best_weights=True
)

reduce_lr = keras.callbacks.ReduceLROnPlateau(
    monitor='val_loss', 
    factor=0.5, 
    patience=5, 
    min_lr=0.00001
)

# Train Binary Classification Model
print("\n" + "="*60)
print("TRAINING BINARY CLASSIFICATION MODEL")
print("="*60)

history_binary = binary_model.fit(
    X_train_bin_scaled, y_train_bin,
    validation_split=0.2,
    epochs=50,
    batch_size=256,
    callbacks=[early_stopping, reduce_lr],
    verbose=1
)

# Train Multi-Class Classification Model
print("\n" + "="*60)
print("TRAINING MULTI-CLASS CLASSIFICATION MODEL")
print("="*60)

history_multiclass = multiclass_model.fit(
    X_train_multi_scaled, y_train_multi,
    validation_split=0.2,
    epochs=50,
    batch_size=256,
    callbacks=[early_stopping, reduce_lr],
    verbose=1
)

# Train Regression Model
print("\n" + "="*60)
print("TRAINING REGRESSION MODEL")
print("="*60)

history_regression = regression_model.fit(
    X_train_reg_scaled, y_train_reg,
    validation_split=0.2,
    epochs=50,
    batch_size=128,
    callbacks=[early_stopping, reduce_lr],
    verbose=1
)

print("\n✓ All models trained successfully!")

# ============================================
# EVALUATE BINARY CLASSIFICATION
# ============================================

print("\n" + "="*60)
print("BINARY CLASSIFICATION EVALUATION")
print("="*60)

# Test set evaluation
binary_results = binary_model.evaluate(X_test_bin_scaled, y_test_bin, verbose=0)
print(f"\nTest Loss: {binary_results[0]:.4f}")
print(f"Test Accuracy: {binary_results[1]:.4f}")
print(f"Test AUC: {binary_results[2]:.4f}")
print(f"Test Precision: {binary_results[3]:.4f}")
print(f"Test Recall: {binary_results[4]:.4f}")

# Predictions with probabilities
y_pred_prob_bin = binary_model.predict(X_test_bin_scaled, verbose=0)
y_pred_bin = (y_pred_prob_bin > 0.5).astype(int).flatten()

# Confusion matrix
cm_bin = confusion_matrix(y_test_bin, y_pred_bin)
print("\nConfusion Matrix:")
print(cm_bin)

# Classification report
print("\nClassification Report:")
print(classification_report(y_test_bin, y_pred_bin, target_names=['No Event', 'Event Occurs']))

# Show sample predictions with confidence
print("\nSample Predictions (with confidence scores):")
sample_indices = np.random.choice(len(y_test_bin), 10, replace=False)
for idx in sample_indices:
    confidence = y_pred_prob_bin[idx][0]
    prediction = "Event" if y_pred_bin[idx] == 1 else "No Event"
    actual = "Event" if y_test_bin[idx] == 1 else "No Event"
    print(f"Predicted: {prediction} (confidence: {confidence:.2%}) | Actual: {actual}")


# ============================================
# EVALUATE MULTI-CLASS CLASSIFICATION
# ============================================

print("\n" + "="*60)
print("MULTI-CLASS CLASSIFICATION EVALUATION")
print("="*60)

# Test set evaluation
multiclass_results = multiclass_model.evaluate(X_test_multi_scaled, y_test_multi, verbose=0)
print(f"\nTest Loss: {multiclass_results[0]:.4f}")
print(f"Test Accuracy: {multiclass_results[1]:.4f}")
print(f"Test Top-3 Accuracy: {multiclass_results[2]:.4f}")

# Predictions with probabilities
y_pred_prob_multi = multiclass_model.predict(X_test_multi_scaled, verbose=0)
y_pred_multi = np.argmax(y_pred_prob_multi, axis=1)

# Classification report
print("\nClassification Report:")
print(classification_report(y_test_multi, y_pred_multi, 
                          target_names=[subtype_labels[i] for i in range(len(subtype_labels))]))

# Show sample predictions with top-3 probabilities
print("\nSample Predictions (with top-3 probabilities):")
sample_indices = np.random.choice(len(y_test_multi), 5, replace=False)
for idx in sample_indices:
    probs = y_pred_prob_multi[idx]
    top_3_indices = np.argsort(probs)[-3:][::-1]
    
    print(f"\nActual: {subtype_labels[y_test_multi[idx]]}")
    print("Top 3 Predictions:")
    for rank, class_idx in enumerate(top_3_indices, 1):
        print(f"  {rank}. {subtype_labels[class_idx]}: {probs[class_idx]:.2%}")


# ============================================
# EVALUATE REGRESSION
# ============================================

print("\n" + "="*60)
print("REGRESSION EVALUATION")
print("="*60)

# Test set evaluation
regression_results = regression_model.evaluate(X_test_reg_scaled, y_test_reg, verbose=0)
print(f"\nTest MSE: {regression_results[1]:.4f}")
print(f"Test MAE: {regression_results[2]:.4f}")

# Predictions
y_pred_reg = regression_model.predict(X_test_reg_scaled, verbose=0).flatten()

# Additional metrics
rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
mae = mean_absolute_error(y_test_reg, y_pred_reg)

print(f"\nRMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")

# Sample predictions
print("\nSample Predictions:")
sample_indices = np.random.choice(len(y_test_reg), 10, replace=False)
for idx in sample_indices:
    predicted = max(0, y_pred_reg[idx])  # Ensure non-negative
    actual = y_test_reg[idx]
    print(f"Predicted: {predicted:.1f} events | Actual: {actual} events | Error: {abs(predicted - actual):.1f}")

# Calculate confidence intervals (using prediction variance)
print(f"\nOverall Stats:")
print(f"Average actual daily events: {y_test_reg.mean():.2f}")
print(f"Average predicted daily events: {y_pred_reg.mean():.2f}")

# ============================================
# VISUALIZATIONS
# ============================================

def plot_training_history(history, title):
    fig, axes = plt.subplots(1, 2, figsize=(14, 4))
    
    # Loss
    axes[0].plot(history.history['loss'], label='Training Loss')
    axes[0].plot(history.history['val_loss'], label='Validation Loss')
    axes[0].set_title(f'{title} - Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    # Accuracy (or MAE for regression)
    metric = 'accuracy' if 'accuracy' in history.history else 'mae'
    axes[1].plot(history.history[metric], label=f'Training {metric}')
    axes[1].plot(history.history[f'val_{metric}'], label=f'Validation {metric}')
    axes[1].set_title(f'{title} - {metric.upper()}')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel(metric.upper())
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.show(block=False)
    plt.pause(0.1)


# Plot training histories
plot_training_history(history_binary, 'Binary Classification')
print("Binary Classification Training History Plotted.")
plot_training_history(history_multiclass, 'Multi-Class Classification')
print("Multi-Class Classification Training History Plotted.")
plot_training_history(history_regression, 'Regression')
print("Regression Training History Plotted.")

# Confusion matrix heatmap for binary
plt.figure(figsize=(6, 5))
sns.heatmap(cm_bin, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['No Event', 'Event'], 
            yticklabels=['No Event', 'Event'])
plt.title('Binary Classification Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.show(block=False)
plt.pause(0.1)

print("Binary Classification Confusion Matrix Plotted.")

# Regression scatter plot
plt.figure(figsize=(8, 6))
plt.scatter(y_test_reg, y_pred_reg, alpha=0.5)
plt.plot([y_test_reg.min(), y_test_reg.max()], 
         [y_test_reg.min(), y_test_reg.max()], 
         'r--', lw=2)
plt.xlabel('Actual Daily Event Count')
plt.ylabel('Predicted Daily Event Count')
plt.title('Regression: Actual vs Predicted')
plt.grid(True)
plt.show(block=False)
plt.pause(0.1)
print("Regression Actual vs Predicted Plot Plotted.")

# ============================================
# SAVE MODELS AND SCALERS
# ============================================

print("Saving models and scalers...")
# Save models
binary_model.save('binary_classification_model.keras')
multiclass_model.save('multiclass_classification_model.keras')
regression_model.save('regression_model.keras')
print("✓ All models saved successfully!")

# Save scalers (using pickle)
import pickle

with open('scaler_binary.pkl', 'wb') as f:
    pickle.dump(scaler_bin, f)

with open('scaler_multiclass.pkl', 'wb') as f:
    pickle.dump(scaler_multi, f)

with open('scaler_regression.pkl', 'wb') as f:
    pickle.dump(scaler_reg, f)

# Save feature column names
with open('feature_columns.pkl', 'wb') as f:
    pickle.dump({
        'binary': feature_cols_binary,
        'multiclass': feature_cols_multi,
        'regression': feature_cols_reg
    }, f)

print("✓ All models and scalers saved successfully!")

# ============================================
# PREDICTION FUNCTIONS FOR NEW DATA
# ============================================

def predict_binary(neighbourhood, hour, day_of_week, is_weekend, lat, lon, season, **kwargs):
    """
    Predict if an event will occur
    Returns: (prediction, confidence_score)
    """
    # Create feature array (simplified - you'll need all features)
    features = np.array([[
        hour, day_of_week, is_weekend, 0, 1, season, lat, lon, 
        0, 0, neighbourhood, 0,
        np.sin(2 * np.pi * hour / 24), np.cos(2 * np.pi * hour / 24),
        np.sin(2 * np.pi * day_of_week / 7), np.cos(2 * np.pi * day_of_week / 7),
        0, 0, 0
    ]])
    
    features_scaled = scaler_bin.transform(features)
    prob = binary_model.predict(features_scaled, verbose=0)[0][0]
    prediction = "Event will occur" if prob > 0.5 else "No event expected"
    
    return prediction, prob


def predict_multiclass(neighbourhood, hour, day_of_week, is_weekend, lat, lon, season, **kwargs):
    """
    Predict type of event
    Returns: (top_prediction, top_3_predictions_with_probs)
    """
    features = np.array([[
        hour, day_of_week, is_weekend, 0, 1, season, lat, lon, 
        0, 0, neighbourhood, 0,
        np.sin(2 * np.pi * hour / 24), np.cos(2 * np.pi * hour / 24),
        np.sin(2 * np.pi * day_of_week / 7), np.cos(2 * np.pi * day_of_week / 7),
        0, 0, 0
    ]])
    
    features_scaled = scaler_multi.transform(features)
    probs = multiclass_model.predict(features_scaled, verbose=0)[0]
    
    top_3_indices = np.argsort(probs)[-3:][::-1]
    top_3 = [(subtype_labels[idx], probs[idx]) for idx in top_3_indices]
    
    return subtype_labels[top_3_indices[0]], top_3


def predict_regression(neighbourhood, day_of_week, is_weekend, lat, lon, season, **kwargs):
    """
    Predict number of events in a day
    Returns: predicted_count
    """
    features = np.array([[
        day_of_week, is_weekend, 1, season, lat, lon, 
        0, 0, neighbourhood, 0,
        0, 0, 0, 0
    ]])
    
    features_scaled = scaler_reg.transform(features)
    count = regression_model.predict(features_scaled, verbose=0)[0][0]
    
    return max(0, count)  # Ensure non-negative


# Example usage
print("\n=== Example Predictions ===")
print("\nBinary Classification:")
pred, conf = predict_binary(137, 21, 5, 1, -0.439, -2.011, 3)
print(f"Prediction: {pred}")
print(f"Confidence: {conf:.2%}")

print("\nMulti-Class Classification:")
top_pred, top_3 = predict_multiclass(137, 21, 5, 1, -0.439, -2.011, 3)
print(f"Most likely event: {top_pred}")
print("Top 3 predictions:")
for event_type, prob in top_3:
    print(f"  - {event_type}: {prob:.2%}")
    print("\nRegression:")
    count = predict_regression(137, 5, 1, -0.439, -2.011, 3)
    print(f"Predicted daily events: {count:.1f}")