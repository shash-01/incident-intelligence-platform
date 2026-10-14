from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI, HTTPException
import logging
import random
import time

app = FastAPI(title="Order Service")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

Instrumentator().instrument(app).expose(app)


@app.get("/")
def home():
    logging.info("Order service is running")
    return {"service": "order-service", "status": "running"}


@app.get("/orders/{order_id}")
def get_order(order_id: int):
    logging.info(f"Fetching order {order_id}")

    return {
        "order_id": order_id,
        "status": "confirmed",
        "amount": random.randint(100, 5000)
    }


@app.get("/simulate-delay")
def simulate_delay():
    delay = random.uniform(0.5, 3.0)

    logging.warning(
        f"Simulating high order latency: {delay:.2f} seconds"
    )

    time.sleep(delay)

    return {
        "message": "Order delay simulated",
        "delay": delay
    }


@app.get("/simulate-error")
def simulate_error():
    logging.error("Simulated order processing error")

    raise HTTPException(status_code=500, detail="Simulated error")