from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import HTTPException
import logging
import random
import time
import sys

app = FastAPI(title="User Service")

import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
    force=True
)

Instrumentator().instrument(app).expose(app)


@app.get("/")
def home():
    logging.info("User service is running")
    return {"service": "user-service", "status": "running"}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    logging.info(f"Fetching user {user_id}")

    return {
        "user_id": user_id,
        "name": f"User-{user_id}",
        "status": "active"
    }


@app.get("/simulate-delay")
def simulate_delay():
    delay = random.uniform(0.5, 3.0)

    logging.warning(
        f"Simulating high latency: {delay:.2f} seconds"
    )

    time.sleep(delay)

    return {
        "message": "Delay simulated",
        "delay": delay
    }


@app.get("/simulate-error")
def simulate_error():
    logging.error("Simulated payment/user-service error")

    raise HTTPException(status_code=500, detail="Simulated error")

@app.get("/simulate-cpu")
def simulate_cpu():
    logging.warning("CPU stress simulation started")

    start_time = time.time()

    while time.time() - start_time < 15:
        _ = sum(i * i for i in range(10000))

    logging.warning("CPU stress simulation completed")

    return {"message": "CPU stress simulation completed"}