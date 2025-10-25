import requests
from uuid import uuid4
from datetime import datetime
import sys

# Local API URL
local_url = "http://127.0.0.1:8000/log"
live_url = "https://llm-chrome-extension.onrender.com/log"

# Create test data
data = {
    "uuid": str(uuid4()),
    "timestamp": datetime.now().strftime("%Y%m%d:%H%M%S"),
    "token_count": 12345,
}


if __name__ == "__main__":
    num_args = len(sys.argv)
    if num_args > 1 and sys.argv[1] == "live":
        url = live_url
    else:
        url = local_url

    # Send POST request
    response = requests.post(url, json=data)

    # Print response
    print("Status code:", response.status_code)
    print("Response JSON:", response.json())
