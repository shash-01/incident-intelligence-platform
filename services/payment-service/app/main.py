from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI, HTTPException
import logging
import random
import time

app = FastAPI(title="Payment Service")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

Instrumentator().instrument(app).expose(app)


@app.get("/")
def home():
    logging.info("Payment service is running")
    return {"service": "payment-service", "status": "running"}


@app.post("/payments/{payment_id}")
def process_payment(payment_id: int):
    logging.info(f"Processing payment {payment_id}")

    return {
        "payment_id": payment_id,
        "status": "successful",
        "amount": random.randint(100, 5000)
    }


@app.get("/simulate-delay")
def simulate_delay():
    delay = random.uniform(0.5, 3.0)

    logging.warning(
        f"Simulating high payment latency: {delay:.2f} seconds"
    )

    time.sleep(delay)

    return {
        "message": "Payment delay simulated",
        "delay": delay
    }


@app.get("/simulate-error")
def simulate_error():
    logging.error("Simulated payment processing error")

    raise HTTPException(status_code=500, detail="Simulated error")