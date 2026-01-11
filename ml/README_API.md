# City Safety ML API Documentation

## Quick Start

1. Start the server:
```bash
python ml_api.py
```

2. The API will be available at: `http://localhost:5000`

## Endpoints

### 1. Get All Predictions (RECOMMENDED)
**POST** `/predict/all`

Returns predictions from all three models in one call.

**Request:**
```javascript
fetch('http://localhost:5000/predict/all', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    neighbourhood: 137,
    hour: 21,
    day_of_week: 5,
    is_weekend: 1,
    lat: -0.439,
    lon: -2.011,
    season_encoded: 3,
    month: 2,
    is_night: 0,
    quarter: 1,
    lat_zone: 7,
    lon_zone: 1,
    neighbourhood_incident_count: 36559,
    events_this_hour: 0
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "binary_classification": {
    "prediction": "event_will_occur",
    "probability": 0.7234,
    "confidence": 0.7234
  },
  "multiclass_classification": {
    "most_likely_event": "Crime-Assault-Simple",
    "top_3_predictions": [
      {"event_type": "Crime-Assault-Simple", "probability": 0.45},
      {"event_type": "Fire-Outdoor-Rubbish", "probability": 0.23},
      {"event_type": "Collision-Other", "probability": 0.12}
    ]
  },
  "regression": {
    "predicted_daily_events": 8.5,
    "rounded_count": 9
  },
  "overall_assessment": {
    "risk_level": "medium",
    "risk_score": 0.52,
    "recommendation": "Moderate risk. Stay aware of surroundings."
  }
}
```

### 2. Binary Classification Only
**POST** `/predict/binary`

Quick yes/no: will an event occur?

### 3. Multi-Class Classification Only
**POST** `/predict/multiclass`

What type of event is most likely?

### 4. Regression Only
**POST** `/predict/regression`

How many events expected today?

### 5. Health Check
**GET** `/health`

Check if API is running.

### 6. Model Information
**GET** `/models/info`

Get details about all models and their features.

## Input Fields Explained

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `neighbourhood` | int | Encoded neighbourhood ID | 137 |
| `hour` | int | Hour of day (0-23) | 21 |
| `day_of_week` | int | Day (0=Mon, 6=Sun) | 5 |
| `is_weekend` | int | 1 if weekend, 0 otherwise | 1 |
| `lat` | float | Latitude (normalized) | -0.439 |
| `lon` | float | Longitude (normalized) | -2.011 |
| `season_encoded` | int | Season code | 3 |
| `month` | int | Month (1-12) | 2 |
| `is_night` | int | 1 if night, 0 otherwise | 0 |
| `quarter` | int | Quarter (1-4) | 1 |
| `lat_zone` | int | Latitude zone | 7 |
| `lon_zone` | int | Longitude zone | 1 |
| `neighbourhood_incident_count` | int | Historical count | 36559 |
| `events_this_hour` | int | Current hour events | 0 |

## React/Next.js Example
```javascript
// api/predictions.js
export async function getPredictions(locationData) {
  try {
    const response = await fetch('http://localhost:5000/predict/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData)
    });
    
    if (!response.ok) {
      throw new Error('Prediction failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
}

// Usage in component
import { getPredictions } from './api/predictions';

function SafetyDashboard() {
  const [predictions, setPredictions] = useState(null);
  
  useEffect(() => {
    const fetchPredictions = async () => {
      const data = await getPredictions({
        neighbourhood: 137,
        hour: new Date().getHours(),
        // ... other fields
      });
      setPredictions(data);
    };
    
    fetchPredictions();
  }, []);
  
  return (
    <div>
      {predictions && (
        <>
          <h2>Risk Level: {predictions.overall_assessment.risk_level}</h2>
          <p>{predictions.overall_assessment.recommendation}</p>
          <p>Most likely: {predictions.multiclass_classification.most_likely_event}</p>
        </>
      )}
    </div>
  );
}
```

## Error Handling

All endpoints return this format on error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Always check `success` field before using data.