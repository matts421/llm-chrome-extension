import requests
from uuid import uuid4
from datetime import datetime

# Local API URL
url = "http://127.0.0.1:8000/log"

# Create test data
data = {
    "uuid": str(uuid4()),
    "timestamp": datetime.now().strftime("%Y%m%d:%H%M%S"),
    "token_count": 12345
}

# Send POST request
response = requests.post(url, json=data)

# Print response
print("Status code:", response.status_code)
print("Response JSON:", response.json())
