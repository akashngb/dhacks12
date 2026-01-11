import requests
import json

BASE_URL = "http://localhost:5006"

print("="*60)
print("Testing City Safety Inverse Prediction API")
print("="*60)

# Test 1: datetime + neighbourhood → event_subtype
print("\n[Test 1] datetime + neighbourhood → event_subtype")
response1 = requests.post(
    f"{BASE_URL}/predict",
    json={'datetime': 1705017600, 'neighbourhood': 137},
    headers={'Content-Type': 'application/json'}
)
print(f"Status: {response1.status_code}")
print(f"Response: {json.dumps(response1.json(), indent=2)}")

# Test 2: datetime + event_subtype → location (lat, lon)
print("\n[Test 2] datetime + event_subtype → location (lat, lon)")
response2 = requests.post(
    f"{BASE_URL}/predict",
    json={'datetime': 1705017600, 'event_subtype': 'Crime-Assault-Simple'},
    headers={'Content-Type': 'application/json'}
)
print(f"Status: {response2.status_code}")
print(f"Response: {json.dumps(response2.json(), indent=2)}")

# Test 3: neighbourhood + event_subtype → datetime (hour)
print("\n[Test 3] neighbourhood + event_subtype → datetime (hour)")
response3 = requests.post(
    f"{BASE_URL}/predict",
    json={'neighbourhood': 137, 'event_subtype': 'Crime-Assault-Simple'},
    headers={'Content-Type': 'application/json'}
)
print(f"Status: {response3.status_code}")
print(f"Response: {json.dumps(response3.json(), indent=2)}")

print("\n" + "="*60)
print("All tests completed!")
print("="*60)