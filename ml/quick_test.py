import requests
import json

BASE_URL = "http://localhost:5006"

# Test 1: datetime + location → event
response = requests.post(
    f"{BASE_URL}/predict",
    json={'datetime': 1705017600, 'neighbourhood': 137},
    headers={'Content-Type': 'application/json'}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")