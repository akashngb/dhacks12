import requests
import json

# Base URL
BASE_URL = "http://localhost:5000"

# Test data
test_data = {
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

print("="*60)
print("Testing City Safety ML API")
print("="*60)

# Test 1: Health check
print("\n1. Health Check")
response = requests.get(f"{BASE_URL}/health")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: Binary classification
print("\n2. Binary Classification")
response = requests.post(f"{BASE_URL}/predict/binary", json=test_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 3: Multi-class classification
print("\n3. Multi-Class Classification")
response = requests.post(f"{BASE_URL}/predict/multiclass", json=test_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 4: Regression
print("\n4. Regression")
response = requests.post(f"{BASE_URL}/predict/regression", json=test_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 5: All predictions
print("\n5. All Predictions (Recommended for frontend)")
response = requests.post(f"{BASE_URL}/predict/all", json=test_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 6: Models info
print("\n6. Models Info")
response = requests.get(f"{BASE_URL}/models/info")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

print("\n" + "="*60)
print("All tests complete!")
print("="*60)