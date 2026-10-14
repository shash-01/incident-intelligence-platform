import requests
from datetime import datetime, timezone, timedelta


LOKI_URL = "http://localhost:3100"


def datetime_to_ns(timestamp):
    """
    Convert a datetime or ISO timestamp into
    nanoseconds required by Loki.
    """

    if isinstance(timestamp, str):
        timestamp = datetime.fromisoformat(
            timestamp.replace("Z", "+00:00")
        )

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(
            tzinfo=timezone.utc
        )

    return str(
        int(
            timestamp.timestamp()
            * 1_000_000_000
        )
    )


def query_logs(
    service_name,
    start_time,
    end_time,
    limit=100
):
    """
    Query Loki logs for a specific service
    within a given time window.
    """

    start_ns = datetime_to_ns(
        start_time
    )

    end_ns = datetime_to_ns(
        end_time
    )

    params = {
        "query": (
            f'{{service_name="{service_name}"}}'
        ),
        "start": start_ns,
        "end": end_ns,
        "limit": limit,
        "direction": "forward"
    }

    response = requests.get(
        f"{LOKI_URL}/loki/api/v1/query_range",
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    logs = []

    for stream in data.get(
        "data", {}
    ).get(
        "result", []
    ):

        labels = stream.get(
            "stream",
            {}
        )

        for entry in stream.get(
            "values",
            []
        ):

            logs.append({
                "timestamp": entry[0],
                "message": entry[1],
                "labels": labels
            })

    return logs


if __name__ == "__main__":

    print(
        "Testing live Loki log retrieval..."
    )

    end_time = datetime.now(
        timezone.utc
    )

    start_time = (
        end_time -
        timedelta(minutes=5)
    )

    print(
        "\nStart:",
        start_time
    )

    print(
        "End:",
        end_time
    )

    logs = query_logs(
        service_name="user-service",
        start_time=start_time,
        end_time=end_time,
        limit=100
    )

    print(
        "\nLogs retrieved:",
        len(logs)
    )

    for log in logs:

        timestamp = (
            datetime.fromtimestamp(
                int(log["timestamp"])
                / 1_000_000_000,
                tz=timezone.utc
            )
        )

        print(
            f"{timestamp} | "
            f"{log['message']}"
        )