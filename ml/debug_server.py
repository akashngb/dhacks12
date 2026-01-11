import requests

url = "http://localhost:5000/predict"
payload = {"datetime": 1705017600, "neighbourhood": 137}

print("Attempting request...")
try:
    response = requests.post(url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content Length: {len(response.content)}")
    print(f"Content: '{response.text}'")
    print(f"Raw Content: {response.content}")
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")