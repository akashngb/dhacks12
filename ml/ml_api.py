from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow import keras
import pickle
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# ============================================
# LOAD MODELS AND SCALERS ON STARTUP
# ============================================

print("Loading models and scalers...")

# Load models
binary_model = keras.models.load_model('binary_classification_model.keras')
multiclass_model = keras.models.load_model('multiclass_classification_model.keras')
regression_model = keras.models.load_model('regression_model.keras')

# Load scalers
with open('scaler_binary.pkl', 'rb') as f:
    scaler_binary = pickle.load(f)

with open('scaler_multiclass.pkl', 'rb') as f:
    scaler_multiclass = pickle.load(f)

with open('scaler_regression.pkl', 'rb') as f:
    scaler_regression = pickle.load(f)

# Load feature columns
with open('feature_columns.pkl', 'rb') as f:
    feature_columns = pickle.load(f)

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

print("✓ Models loaded successfully!")

# ============================================
# HELPER FUNCTIONS
# ============================================

def create_feature_array(data, model_type='binary'):
    """
    Create feature array from input data with cyclical encoding
    """
    hour = data.get('hour', 12)
    day_of_week = data.get('day_of_week', 0)
    month = data.get('month', 1)
    
    # Cyclical features
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    day_of_week_sin = np.sin(2 * np.pi * day_of_week / 7)
    day_of_week_cos = np.cos(2 * np.pi * day_of_week / 7)
    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)
    
    if model_type in ['binary', 'multiclass']:
        # Hourly prediction features
        features = np.array([[
            data.get('hour', 12),
            data.get('day_of_week', 0),
            data.get('is_weekend', 0),
            data.get('is_night', 0),
            data.get('quarter', 1),
            data.get('season_encoded', 0),
            data.get('lat', 0.0),
            data.get('lon', 0.0),
            data.get('lat_zone', 0),
            data.get('lon_zone', 0),
            data.get('neighbourhood', 0),
            data.get('neighbourhood_incident_count', 0),
            hour_sin,
            hour_cos,
            day_of_week_sin,
            day_of_week_cos,
            month_sin,
            month_cos,
            data.get('events_this_hour', 0)
        ]])
    else:  # regression (daily prediction)
        features = np.array([[
            data.get('day_of_week', 0),
            data.get('is_weekend', 0),
            data.get('quarter', 1),
            data.get('season_encoded', 0),
            data.get('lat', 0.0),
            data.get('lon', 0.0),
            data.get('lat_zone', 0),
            data.get('lon_zone', 0),
            data.get('neighbourhood', 0),
            data.get('neighbourhood_incident_count', 0),
            month_sin,
            month_cos,
            day_of_week_sin,
            day_of_week_cos
        ]])
    
    return features


# ============================================
# API ENDPOINTS
# ============================================

@app.route('/', methods=['GET'])
def home():
    """API info endpoint"""
    return jsonify({
        'message': 'City Safety ML API',
        'version': '1.0',
        'endpoints': {
            '/predict/binary': 'Binary classification - Will an event occur?',
            '/predict/multiclass': 'Multi-class - What type of event?',
            '/predict/regression': 'Regression - How many events today?',
            '/predict/all': 'Get predictions from all three models'
        },
        'status': 'ready'
    })


@app.route('/predict/binary', methods=['POST'])
def predict_binary():
    """
    Binary classification: Will an event occur in this neighbourhood in the next hour?
    
    Expected JSON input:
    {
        "neighbourhood": 137,
        "hour": 21,
        "day_of_week": 5,
        "is_weekend": 1,
        "lat": -0.439,
        "lon": -2.011,
        "season_encoded": 3,
        "month": 2,
        "is_night": 0,
        "quarter": 1,
        "lat_zone": 7,
        "lon_zone": 1,
        "neighbourhood_incident_count": 36559,
        "events_this_hour": 0
    }
    """
    try:
        data = request.get_json()
        
        # Create features
        features = create_feature_array(data, 'binary')
        features_scaled = scaler_binary.transform(features)
        
        # Predict
        probability = float(binary_model.predict(features_scaled, verbose=0)[0][0])
        prediction = probability > 0.5
        
        return jsonify({
            'success': True,
            'model': 'binary_classification',
            'prediction': 'event_will_occur' if prediction else 'no_event_expected',
            'probability': round(probability, 4),
            'confidence': round(probability if prediction else (1 - probability), 4),
            'details': {
                'neighbourhood': data.get('neighbourhood'),
                'hour': data.get('hour'),
                'interpretation': f"{'High' if probability > 0.7 else 'Medium' if probability > 0.3 else 'Low'} risk of event occurring"
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/predict/multiclass', methods=['POST'])
def predict_multiclass():
    """
    Multi-class classification: What TYPE of event is most likely?
    
    Expected JSON input: Same as binary
    """
    try:
        data = request.get_json()
        
        # Create features
        features = create_feature_array(data, 'multiclass')
        features_scaled = scaler_multiclass.transform(features)
        
        # Predict
        probabilities = multiclass_model.predict(features_scaled, verbose=0)[0]
        
        # Get top 5 predictions
        top_5_indices = np.argsort(probabilities)[-5:][::-1]
        top_5_predictions = [
            {
                'event_type': subtype_labels[int(idx)],
                'probability': round(float(probabilities[idx]), 4),
                'rank': rank + 1
            }
            for rank, idx in enumerate(top_5_indices)
        ]
        
        # Most likely prediction
        most_likely_idx = int(np.argmax(probabilities))
        most_likely = subtype_labels[most_likely_idx]
        most_likely_prob = float(probabilities[most_likely_idx])
        
        return jsonify({
            'success': True,
            'model': 'multiclass_classification',
            'most_likely_event': most_likely,
            'probability': round(most_likely_prob, 4),
            'top_5_predictions': top_5_predictions,
            'details': {
                'neighbourhood': data.get('neighbourhood'),
                'hour': data.get('hour'),
                'total_event_types': len(subtype_labels)
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/predict/regression', methods=['POST'])
def predict_regression():
    """
    Regression: How many events will occur in this area today?
    
    Expected JSON input:
    {
        "neighbourhood": 137,
        "day_of_week": 5,
        "is_weekend": 1,
        "lat": -0.439,
        "lon": -2.011,
        "season_encoded": 3,
        "month": 2,
        "quarter": 1,
        "lat_zone": 7,
        "lon_zone": 1,
        "neighbourhood_incident_count": 36559
    }
    """
    try:
        data = request.get_json()
        
        # Create features
        features = create_feature_array(data, 'regression')
        features_scaled = scaler_regression.transform(features)
        
        # Predict
        predicted_count = float(regression_model.predict(features_scaled, verbose=0)[0][0])
        predicted_count = max(0, predicted_count)  # Ensure non-negative
        
        # Risk level based on predicted count
        if predicted_count < 5:
            risk_level = 'low'
        elif predicted_count < 15:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return jsonify({
            'success': True,
            'model': 'regression',
            'predicted_event_count': round(predicted_count, 2),
            'rounded_count': int(round(predicted_count)),
            'risk_level': risk_level,
            'details': {
                'neighbourhood': data.get('neighbourhood'),
                'day_of_week': data.get('day_of_week'),
                'interpretation': f"Expect approximately {int(round(predicted_count))} events today"
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/predict/all', methods=['POST'])
def predict_all():
    """
    Get predictions from all three models at once
    
    Expected JSON input: Combined fields from all models
    """
    try:
        data = request.get_json()
        
        # Binary prediction
        features_bin = create_feature_array(data, 'binary')
        features_bin_scaled = scaler_binary.transform(features_bin)
        binary_prob = float(binary_model.predict(features_bin_scaled, verbose=0)[0][0])
        binary_pred = binary_prob > 0.5
        
        # Multiclass prediction
        features_multi = create_feature_array(data, 'multiclass')
        features_multi_scaled = scaler_multiclass.transform(features_multi)
        multi_probs = multiclass_model.predict(features_multi_scaled, verbose=0)[0]
        top_3_indices = np.argsort(multi_probs)[-3:][::-1]
        top_3 = [
            {
                'event_type': subtype_labels[int(idx)],
                'probability': round(float(multi_probs[idx]), 4)
            }
            for idx in top_3_indices
        ]
        
        # Regression prediction
        features_reg = create_feature_array(data, 'regression')
        features_reg_scaled = scaler_regression.transform(features_reg)
        daily_count = float(regression_model.predict(features_reg_scaled, verbose=0)[0][0])
        daily_count = max(0, daily_count)
        
        # Overall risk assessment
        risk_score = (binary_prob * 0.4) + (min(daily_count / 20, 1.0) * 0.6)
        if risk_score < 0.3:
            overall_risk = 'low'
        elif risk_score < 0.6:
            overall_risk = 'medium'
        else:
            overall_risk = 'high'
        
        return jsonify({
            'success': True,
            'timestamp': data.get('timestamp', 'not_provided'),
            'location': {
                'neighbourhood': data.get('neighbourhood'),
                'lat': data.get('lat'),
                'lon': data.get('lon')
            },
            'binary_classification': {
                'prediction': 'event_will_occur' if binary_pred else 'no_event_expected',
                'probability': round(binary_prob, 4),
                'confidence': round(binary_prob if binary_pred else (1 - binary_prob), 4)
            },
            'multiclass_classification': {
                'most_likely_event': top_3[0]['event_type'],
                'top_3_predictions': top_3
            },
            'regression': {
                'predicted_daily_events': round(daily_count, 2),
                'rounded_count': int(round(daily_count))
            },
            'overall_assessment': {
                'risk_level': overall_risk,
                'risk_score': round(risk_score, 4),
                'recommendation': get_recommendation(overall_risk, top_3[0]['event_type'])
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


def get_recommendation(risk_level, event_type):
    """Generate user-friendly recommendation"""
    if risk_level == 'high':
        return f"High risk area. Exercise caution. Most likely incident type: {event_type}"
    elif risk_level == 'medium':
        return f"Moderate risk. Stay aware of surroundings. Watch for: {event_type}"
    else:
        return "Low risk area. Normal precautions recommended."


@app.route('/models/info', methods=['GET'])
def models_info():
    """Get information about all models"""
    return jsonify({
        'success': True,
        'models': {
            'binary_classification': {
                'description': 'Predicts if an event will occur in the next hour',
                'input_features': feature_columns['binary'],
                'output': 'probability (0-1)',
                'use_case': 'Real-time risk assessment for specific locations and times'
            },
            'multiclass_classification': {
                'description': 'Predicts the type of event most likely to occur',
                'input_features': feature_columns['multiclass'],
                'output': 'event type with probability distribution',
                'num_classes': len(subtype_labels),
                'event_types': list(subtype_labels.values()),
                'use_case': 'Understanding what kind of incidents to prepare for'
            },
            'regression': {
                'description': 'Predicts the number of events expected in a day',
                'input_features': feature_columns['regression'],
                'output': 'count of events',
                'use_case': 'Daily planning and resource allocation'
            }
        }
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': True,
        'message': 'All systems operational'
    })


# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 City Safety ML API Server")
    print("="*60)
    print("\nServer starting on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /              - API info")
    print("  GET  /health        - Health check")
    print("  GET  /models/info   - Model information")
    print("  POST /predict/binary     - Binary classification")
    print("  POST /predict/multiclass - Multi-class classification")
    print("  POST /predict/regression - Regression")
    print("  POST /predict/all        - All predictions at once")
    print("\n" + "="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5067)