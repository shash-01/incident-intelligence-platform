import requests
import random
import time

SERVICES = {
    "user-service": {
        "url": "http://localhost:8000",
        "endpoints": [
            "/",
            "/users/101"
        ]
    },

    "order-service": {
        "url": "http://localhost:8001",
        "endpoints": [
            "/",
            "/orders/101"
        ]
    },

    "payment-service": {
        "url": "http://localhost:8002",
        "endpoints": [
            "/"
        ]
    }
}


while True:

    service_name = random.choice(list(SERVICES.keys()))

    service = SERVICES[service_name]

    endpoint = random.choice(service["endpoints"])

    try:

        response = requests.get(
            service["url"] + endpoint,
            timeout=5
        )

        print(
            f"{service_name} "
            f"{endpoint} -> "
            f"{response.status_code}"
        )

    except Exception as e:

        print(
            f"{service_name} "
            f"{endpoint} -> Request failed: {e}"
        )

    time.sleep(random.uniform(0.2, 1.0))