import requests
import pandas as pd
import time
from datetime import datetime
import os

PROMETHEUS_URL = "http://localhost:9090/api/v1/query"

SERVICES = [
    "user-service",
    "order-service",
    "payment-service"
]

OUTPUT_FILE = "ml/data/metrics_dataset.csv"


def query_prometheus(query):
    response = requests.get(
        PROMETHEUS_URL,
        params={"query": query},
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    if data["status"] != "success":
        raise Exception("Prometheus query failed")

    return data["data"]["result"]


def get_metric(query):
    results = query_prometheus(query)

    if not results:
        return 0.0

    return float(results[0]["value"][1])


def collect_metrics():

    rows = []

    for service in SERVICES:

        request_rate = get_metric(
            f'sum(rate(http_requests_total{{job="{service}"}}[1m]))'
        )

        error_rate = get_metric(
            f'sum(rate(http_requests_total{{job="{service}",status=~"4xx|5xx"}}[1m]))'
        )

        latency = get_metric(
            f'''
            sum(rate(http_request_duration_seconds_sum{{job="{service}"}}[1m]))
            /
            sum(rate(http_request_duration_seconds_count{{job="{service}"}}[1m]))
            '''
        )

        memory = get_metric(
            f'sum(process_resident_memory_bytes{{job="{service}"}})'
        )
        cpu = get_metric(
            f'sum(rate(process_cpu_seconds_total{{job="{service}"}}[1m])) * 100'
        )

        rows.append({
            "timestamp": datetime.now().isoformat(),
            "service": service,
            "request_rate": request_rate,
            "error_rate": error_rate,
            "latency": latency,
            "memory": memory,
            "cpu": cpu
        })

    return pd.DataFrame(rows)


def save_metrics(df):

    file_exists = os.path.exists(OUTPUT_FILE)

    df.to_csv(
        OUTPUT_FILE,
        mode="a",
        header=not file_exists,
        index=False
    )


if __name__ == "__main__":

    print("Starting continuous metric collection...")
    print("Press CTRL+C to stop.\n")

    try:

        while True:

            df = collect_metrics()

            save_metrics(df)

            print(
                f"[{datetime.now().strftime('%H:%M:%S')}] "
                f"Collected {len(df)} service records"
            )

            time.sleep(5)

    except KeyboardInterrupt:

        print("\nMetric collection stopped.")