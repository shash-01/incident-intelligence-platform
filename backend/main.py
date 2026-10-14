import sys
import os
import requests
import pandas as pd

from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


from agents.incident_agent import IncidentAgent
from agents.root_cause_agent import RootCauseAgent
from agents.recommendation_agent import RecommendationAgent


app = FastAPI(
    title="AI-Driven Incident Intelligence Platform",
    description=(
        "Backend API for anomaly detection, explainability, "
        "root cause analysis, RAG, and AI recommendations."
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


incident_agent = IncidentAgent()
root_cause_agent = RootCauseAgent()
recommendation_agent = RecommendationAgent()


@app.get("/health")
def health_check():

    services = {
        "user_service": 0,
        "order_service": 0,
        "payment_service": 0
    }

    service_queries = {
        "user_service": 'up{job="user-service"}',
        "order_service": 'up{job="order-service"}',
        "payment_service": 'up{job="payment-service"}'
    }

    for service_name, query in service_queries.items():

        try:

            response = requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": query
                },
                timeout=5
            )

            response.raise_for_status()

            data = response.json()

            result = (
                data
                .get("data", {})
                .get("result", [])
            )

            if result:
                services[service_name] = int(
                    float(result[0]["value"][1])
                )
            else:
                services[service_name] = 0

        except Exception as error:

            print(
                f"Service health query failed for "
                f"{service_name}: {error}"
            )

            services[service_name] = 0

    return {
        "status": "healthy",
        "service": "incident-intelligence-backend",
        "services": services
    }


@app.get("/metrics/current")
def get_current_metrics():

    queries = {

        "cpu": (
            'sum('
            'rate('
            'process_cpu_seconds_total'
            '{job=~"user-service|order-service|payment-service"}'
            '[1m]'
            ')'
            ') * 100'
        ),

        "memory": (
            'sum('
            'process_resident_memory_bytes'
            '{job=~"user-service|order-service|payment-service"}'
            ')'
        ),

        "request_rate": (
            'sum('
            'rate('
            'http_requests_total'
            '{job=~"user-service|order-service|payment-service"}'
            '[1m]'
            ')'
            ')'
        ),

        "error_rate": (
            'sum('
            'rate('
            'http_requests_total'
            '{job=~"user-service|order-service|payment-service",'
            'status=~"4xx|5xx"}'
            '[1m]'
            ')'
            ')'
        ),

        "latency": (
            'sum('
            'rate('
            'http_request_duration_seconds_sum'
            '{job=~"user-service|order-service|payment-service"}'
            '[1m]'
            ')'
            ')'
            ' / '
            'sum('
            'rate('
            'http_request_duration_seconds_count'
            '{job=~"user-service|order-service|payment-service"}'
            '[1m]'
            ')'
            ')'
        ),

        "user_service": 'up{job="user-service"}',

        "order_service": 'up{job="order-service"}',

        "payment_service": 'up{job="payment-service"}'
    }


    results = {}


    for metric_name, query in queries.items():

        try:

            response = requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": query
                },
                timeout=5
            )

            response.raise_for_status()

            data = response.json()

            result = (
                data
                .get("data", {})
                .get("result", [])
            )

            if result:

                results[metric_name] = float(
                    result[0]["value"][1]
                )

            else:

                results[metric_name] = 0

        except Exception as error:

            print(
                f"Prometheus query failed "
                f"for {metric_name}: {error}"
            )

            results[metric_name] = None


    services = {
        "user_service": (
            1 if results.get("user_service") == 1 else 0
        ),
        "order_service": (
            1 if results.get("order_service") == 1 else 0
        ),
        "payment_service": (
            1 if results.get("payment_service") == 1 else 0
        )
    }


    return {
        "status": "success",

        "cpu": results.get("cpu"),
        "memory": results.get("memory"),
        "request_rate": results.get("request_rate"),
        "error_rate": results.get("error_rate"),
        "latency": results.get("latency"),

        "user_service": services["user_service"],
        "order_service": services["order_service"],
        "payment_service": services["payment_service"],

        "services": services,

        "metrics": {
            "cpu": results.get("cpu"),
            "memory": results.get("memory"),
            "request_rate": results.get("request_rate"),
            "error_rate": results.get("error_rate"),
            "latency": results.get("latency"),

            "user_service": services["user_service"],
            "order_service": services["order_service"],
            "payment_service": services["payment_service"],

            "services": services
        }
    }


@app.get("/incidents/history")
def get_incident_history():

    try:

        file_path = os.path.join(
            PROJECT_ROOT,
            "ml",
            "data",
            "anomaly_evaluation_results.csv"
        )

        if not os.path.exists(file_path):

            return {
                "status": "error",
                "message": (
                    "Anomaly evaluation results file "
                    "was not found."
                )
            }


        df = pd.read_csv(file_path)


        if df.empty:

            return {
                "status": "success",
                "count": 0,
                "incidents": []
            }


        if "baseline_label" in df.columns:

            anomalies = df[
                df["baseline_label"]
                .astype(str)
                .str.strip()
                .str.lower()
                .eq("anomaly")
            ].copy()

        elif "predicted_label" in df.columns:

            anomalies = df[
                df["predicted_label"]
                .astype(str)
                .str.strip()
                .str.lower()
                .eq("anomaly")
            ].copy()

        else:

            return {
                "status": "error",
                "message": (
                    "Neither 'baseline_label' nor "
                    "'predicted_label' exists in the "
                    "anomaly results file."
                )
            }


        if "request_rate" in anomalies.columns:

            anomalies = anomalies[
                pd.to_numeric(
                    anomalies["request_rate"],
                    errors="coerce"
                ).fillna(0) > 0
            ]


        if (
            "cpu" in anomalies.columns
            and "error_rate" in anomalies.columns
        ):

            cpu_values = pd.to_numeric(
                anomalies["cpu"],
                errors="coerce"
            ).fillna(0)

            error_values = pd.to_numeric(
                anomalies["error_rate"],
                errors="coerce"
            ).fillna(0)

            anomalies = anomalies[
                (cpu_values > 2)
                | (error_values > 0)
            ]


        if "timestamp" in anomalies.columns:

            anomalies["timestamp"] = pd.to_datetime(
                anomalies["timestamp"],
                errors="coerce"
            )

            anomalies = anomalies.dropna(
                subset=["timestamp"]
            )

            anomalies = anomalies.sort_values(
                "timestamp",
                ascending=False
            )

            anomalies["timestamp"] = (
                anomalies["timestamp"]
                .dt.strftime("%Y-%m-%d %H:%M:%S.%f")
            )


        anomalies = anomalies.head(50)


        incidents = anomalies.to_dict(
            orient="records"
        )


        clean_incidents = []


        for incident in incidents:

            clean_incident = {}


            for key, value in incident.items():

                if pd.isna(value):

                    clean_incident[key] = None

                elif isinstance(value, float):

                    if value in (
                        float("inf"),
                        float("-inf")
                    ):

                        clean_incident[key] = None

                    else:

                        clean_incident[key] = value

                else:

                    clean_incident[key] = value


            clean_incidents.append(
                clean_incident
            )


        return {
            "status": "success",
            "count": len(clean_incidents),
            "incidents": clean_incidents
        }


    except Exception as error:

        print(
            f"Incident history error: {error}"
        )

        return {
            "status": "error",
            "message": str(error)
        }


@app.get("/logs/recent")
def get_recent_logs(
    minutes: int = 15,
    limit: int = 100
):

    try:

        minutes = max(
            1,
            min(minutes, 60)
        )

        limit = max(
            1,
            min(limit, 500)
        )


        end_time = datetime.now(
            timezone.utc
        )

        start_time = (
            end_time
            - timedelta(minutes=minutes)
        )


        start_ns = str(
            int(
                start_time.timestamp()
                * 1_000_000_000
            )
        )

        end_ns = str(
            int(
                end_time.timestamp()
                * 1_000_000_000
            )
        )


        services = [
            "user-service",
            "order-service",
            "payment-service"
        ]


        logs = []


        for service_name in services:

            try:

                response = requests.get(
                    "http://localhost:3100/loki/api/v1/query_range",
                    params={
                        "query": (
                            f'{{service_name="{service_name}"}}'
                        ),
                        "start": start_ns,
                        "end": end_ns,
                        "limit": limit,
                        "direction": "backward"
                    },
                    timeout=10
                )

                response.raise_for_status()

                data = response.json()

                results = (
                    data
                    .get("data", {})
                    .get("result", [])
                )


                for stream in results:

                    labels = stream.get(
                        "stream",
                        {}
                    )


                    for entry in stream.get(
                        "values",
                        []
                    ):

                        if (
                            not isinstance(entry, list)
                            or len(entry) < 2
                        ):
                            continue


                        logs.append({
                            "timestamp": entry[0],
                            "message": entry[1],
                            "service": service_name,
                            "labels": labels
                        })


            except Exception as service_error:

                print(
                    f"Loki query failed for "
                    f"{service_name}: "
                    f"{service_error}"
                )


        logs.sort(
            key=lambda item: int(
                item["timestamp"]
            ),
            reverse=True
        )


        logs = logs[:limit]


        return {
            "status": "success",
            "count": len(logs),
            "logs": logs
        }


    except Exception as error:

        print(
            f"Loki logs error: {error}"
        )

        return {
            "status": "error",
            "message": str(error)
        }


@app.get("/incidents/latest")
def get_latest_incident():

    try:

        incident_agent.load_anomaly_results()

        incident_agent.load_shap_results()


        strongest_anomaly = (
            incident_agent.get_strongest_anomaly()
        )


        if strongest_anomaly is None:

            return {
                "status": "no_incident",
                "message": "No meaningful anomaly detected."
            }


        incident = (
            incident_agent.create_incident_context(
                strongest_anomaly
            )
        )


        return {
            "status": "incident_detected",
            "incident": incident
        }


    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }


@app.post("/incidents/analyze")
def analyze_incident():

    try:

        result = (
            recommendation_agent.analyze_incident()
        )


        if result is None:

            return {
                "status": "no_incident",
                "message": "No meaningful anomaly found."
            }


        incident = result[
            "incident"
        ]


        root_cause_result = result[
            "root_cause_result"
        ]


        logs = root_cause_result.get(
            "logs",
            []
        )


        if not logs:

            logs = root_cause_result.get(
                "evidence",
                []
            )


        incident["logs"] = logs


        return {

            "status": "analysis_complete",

            "incident": incident,

            "root_cause": {

                "root_cause": root_cause_result.get(
                    "root_cause"
                ),

                "confidence": root_cause_result.get(
                    "confidence"
                ),

                "evidence": root_cause_result.get(
                    "evidence",
                    []
                )
            },

            "shap": result.get(
                "shap_values",
                []
            ),

            "knowledge": result.get(
                "retrieved_knowledge",
                []
            ),

            "llm": {

                "source": result.get(
                    "source"
                ),

                "analysis": result.get(
                    "llm_response"
                )
            }
        }


    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }


@app.get("/")
def root():

    return {
        "message": (
            "AI-Driven Incident Intelligence "
            "Platform API"
        ),
        "docs": "/docs",
        "health": "/health"
    }