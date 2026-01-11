import requests
import json
from datetime import datetime
import time

BASE_URL = "http://127.0.0.1:5041"

print("="*60)
print("Testing Inverse Prediction API")
print("="*60)

# First, check if server is running
print("\n0. Health Check")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print("✓ Server is running!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"✗ Server returned status {response.status_code}")
        print(f"Response: {response.text}")
        exit(1)
except requests.exceptions.ConnectionError:
    print("✗ Cannot connect to server!")
    print("Make sure Flask server is running with: python ml_api.py")
    exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

print("\n" + "="*60)

# Test 1: datetime + neighbourhood → event_subtype
print("\n1. Predict EVENT TYPE from datetime + neighbourhood")
try:
    response = requests.post(f"{BASE_URL}/predict", json={
        "datetime": 1705017600,  # Unix timestamp
        "neighbourhood": 137
    })
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

time.sleep(0.5)

# Test 2: datetime + event_subtype → neighbourhood
print("\n2. Predict NEIGHBOURHOOD from datetime + event_subtype")
try:
    response = requests.post(f"{BASE_URL}/predict", json={
        "datetime": 1705017600,
        "event_subtype": "Crime-Assault-Simple"
    })
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

time.sleep(0.5)

# Test 3: neighbourhood + event_subtype → datetime
print("\n3. Predict TIME from neighbourhood + event_subtype")
try:
    response = requests.post(f"{BASE_URL}/predict", json={
        "neighbourhood": 137,
        "event_subtype": "Crime-Assault-Simple"
    })
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

time.sleep(0.5)

# Test 4: Get all event types
print("\n4. Get all valid event types")
try:
    response = requests.get(f"{BASE_URL}/event_types")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Number of event types: {len(result['event_types'])}")
        print("First 10 event types:")
        for event_type in result['event_types'][:10]:
            print(f"  - {event_type}")
    else:
        print(f"Error response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*60)
print("Tests complete!")
print("="*60)