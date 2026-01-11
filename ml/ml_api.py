from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from tensorflow import keras
import pickle
from datetime import datetime
import warnings
from flask_cors import CORS
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

@app.before_request
def log_request():
    print(f"Incoming request: {request.method} {request.path}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Data: {request.get_data()}")

print("Loading models and metadata...")

# Load models
model1 = keras.models.load_model('model_datetime_location_to_subtype.keras')
model2 = keras.models.load_model('model_datetime_subtype_to_location.keras')
model3 = keras.models.load_model('model_location_subtype_to_datetime.keras')

# Load scalers
with open('scaler_datetime_location_to_subtype.pkl', 'rb') as f:
    scaler1 = pickle.load(f)
with open('scaler_datetime_subtype_to_location.pkl', 'rb') as f:
    scaler2 = pickle.load(f)
with open('scaler_location_subtype_to_datetime.pkl', 'rb') as f:
    scaler3 = pickle.load(f)

# Load metadata
with open('inverse_models_metadata.pkl', 'rb') as f:
    metadata = pickle.load(f)

subtype_labels = metadata['subtype_labels']
subtype_to_int = metadata['subtype_to_int']
neighbourhood_coords = metadata['neighbourhood_coords']  # ADD THIS LINE

subtype_labels = metadata['subtype_labels']
subtype_to_int = metadata['subtype_to_int']

print("✓ Models loaded successfully!")

def unix_to_datetime_features(unix_timestamp):
    """Convert Unix timestamp to datetime features"""
    dt = datetime.fromtimestamp(unix_timestamp)
    
    year = dt.year
    month = dt.month
    day = dt.day
    hour = dt.hour
    day_of_week = dt.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    is_night = 1 if hour < 6 or hour >= 22 else 0
    quarter = (month - 1) // 3 + 1
    
    if month in [12, 1, 2]:
        season = 0
    elif month in [3, 4, 5]:
        season = 1
    elif month in [6, 7, 8]:
        season = 2
    else:
        season = 3
    
    return {
        'year': year, 'month': month, 'day': day, 'hour': hour,
        'day_of_week': day_of_week, 'is_weekend': is_weekend,
        'is_night': is_night, 'quarter': quarter, 'season_encoded': season
    }

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'City Safety Inverse Prediction API',
        'version': '2.0',
        'status': 'ready'
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'models_loaded': True})

@app.route('/event_types', methods=['GET'])
def get_event_types():
    return jsonify({'success': True, 'event_types': list(subtype_to_int.keys())})

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        has_datetime = 'datetime' in data
        has_neighbourhood = 'neighbourhood' in data
        has_event_subtype = 'event_subtype' in data
        
        num_inputs = sum([has_datetime, has_neighbourhood, has_event_subtype])
        
        if num_inputs != 2:
            return jsonify({
                'success': False,
                'error': 'Must provide exactly 2 of 3 fields: datetime, neighbourhood, event_subtype'
            }), 400
        
        # CASE 1: datetime + neighbourhood → event_subtype
        if has_datetime and has_neighbourhood:
            dt_features = unix_to_datetime_features(data['datetime'])
            neighbourhood = data['neighbourhood']
            
            lat = data.get('lat', 0.0)
            lon = data.get('lon', 0.0)
            lat_zone = data.get('lat_zone', 0)
            lon_zone = data.get('lon_zone', 0)
            
            features = np.array([[
                dt_features['year'], dt_features['month'], dt_features['day'],
                dt_features['hour'], dt_features['day_of_week'], dt_features['is_weekend'],
                dt_features['is_night'], dt_features['quarter'], dt_features['season_encoded'],
                neighbourhood, lat, lon, lat_zone, lon_zone
            ]])
            
            features_scaled = scaler1.transform(features)
            probabilities = model1.predict(features_scaled, verbose=0)[0]
            
            top_5_indices = np.argsort(probabilities)[-5:][::-1]
            top_5 = [
                {'event_type': subtype_labels[int(idx)], 
                 'probability': round(float(probabilities[idx]), 4),
                 'rank': rank + 1}
                for rank, idx in enumerate(top_5_indices)
            ]
            
            return jsonify({
                'success': True,
                'prediction_type': 'event_subtype',
                'input': {
                    'datetime': data['datetime'],
                    'datetime_readable': datetime.fromtimestamp(data['datetime']).strftime('%Y-%m-%d %H:%M:%S'),
                    'neighbourhood': neighbourhood
                },
                'output': {
                    'most_likely_event': top_5[0]['event_type'],
                    'confidence': top_5[0]['probability'],
                    'top_5_predictions': top_5
                }
            })
        
        # CASE 2: datetime + event_subtype → location (top 20 lat/lon pairs)
        elif has_datetime and has_event_subtype:
            dt_features = unix_to_datetime_features(data['datetime'])
            event_subtype_str = data['event_subtype']
            
            if event_subtype_str not in subtype_to_int:
                return jsonify({
                    'success': False,
                    'error': f'Invalid event_subtype. Must be one of: {list(subtype_to_int.keys())}'
                }), 400
            
            event_subtype_encoded = subtype_to_int[event_subtype_str]
            
            features = np.array([[
                dt_features['year'], dt_features['month'], dt_features['day'],
                dt_features['hour'], dt_features['day_of_week'], dt_features['is_weekend'],
                dt_features['is_night'], dt_features['quarter'], dt_features['season_encoded'],
                event_subtype_encoded
            ]])
            
            features_scaled = scaler2.transform(features)
            probabilities = model2.predict(features_scaled, verbose=0)[0]
            
            # Get top 20 neighbourhoods
            top_20_indices = np.argsort(probabilities)[-20:][::-1]
            top_20_locations = []
            
            for rank, idx in enumerate(top_20_indices):
                neighbourhood_id = int(idx)
                coords = neighbourhood_coords.get(neighbourhood_id, {'LAT_R': 0.0, 'LON_R': 0.0})
                
                top_20_locations.append({
                    'rank': rank + 1,
                    'neighbourhood': neighbourhood_id,
                    'latitude': float(coords['LAT_R']),
                    'longitude': float(coords['LON_R']),
                    'coordinates': [float(coords['LAT_R']), float(coords['LON_R'])],
                    'probability': round(float(probabilities[idx]), 4)
                })
            
            return jsonify({
                'success': True,
                'prediction_type': 'location',
                'input': {
                    'datetime': data['datetime'],
                    'datetime_readable': datetime.fromtimestamp(data['datetime']).strftime('%Y-%m-%d %H:%M:%S'),
                    'event_subtype': event_subtype_str
                },
                'output': {
                    'most_likely_location': {
                        'latitude': top_20_locations[0]['latitude'],
                        'longitude': top_20_locations[0]['longitude'],
                        'coordinates': top_20_locations[0]['coordinates'],
                        'neighbourhood': top_20_locations[0]['neighbourhood'],
                        'confidence': top_20_locations[0]['probability']
                    },
                    'top_20_locations': top_20_locations
                }
            })
        
        # CASE 3: neighbourhood + event_subtype → datetime (hour)
        elif has_neighbourhood and has_event_subtype:
            neighbourhood = data['neighbourhood']
            event_subtype_str = data['event_subtype']
            
            if event_subtype_str not in subtype_to_int:
                return jsonify({
                    'success': False,
                    'error': f'Invalid event_subtype. Must be one of: {list(subtype_to_int.keys())}'
                }), 400
            
            event_subtype_encoded = subtype_to_int[event_subtype_str]
            
            lat = data.get('lat', 0.0)
            lon = data.get('lon', 0.0)
            lat_zone = data.get('lat_zone', 0)
            lon_zone = data.get('lon_zone', 0)
            
            features = np.array([[
                neighbourhood, lat, lon, lat_zone, lon_zone, event_subtype_encoded
            ]])
            
            features_scaled = scaler3.transform(features)
            probabilities = model3.predict(features_scaled, verbose=0)[0]
            
            top_5_indices = np.argsort(probabilities)[-5:][::-1]
            top_5 = [
                {'hour': int(idx),
                 'time_range': f"{int(idx):02d}:00 - {int(idx):02d}:59",
                 'probability': round(float(probabilities[idx]), 4),
                 'rank': rank + 1}
                for rank, idx in enumerate(top_5_indices)
            ]
            
            return jsonify({
                'success': True,
                'prediction_type': 'datetime',
                'input': {
                    'neighbourhood': neighbourhood,
                    'event_subtype': event_subtype_str
                },
                'output': {
                    'most_likely_hour': top_5[0]['hour'],
                    'most_likely_time_range': top_5[0]['time_range'],
                    'confidence': top_5[0]['probability'],
                    'top_5_hours': top_5
                }
            })
        
        else:
            return jsonify({'success': False, 'error': 'Invalid combination'}), 400
    
    except Exception as e:
        import traceback
        print("ERROR:", str(e))
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 City Safety Inverse Prediction API")
    print("="*60)
    print("\nServer starting on http://localhost:5006")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5006, threaded=True)