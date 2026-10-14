const API_BASE_URL = "http://127.0.0.1:8003";

export async function checkBackendHealth() {
  const response = await fetch(
    `${API_BASE_URL}/health`
  );

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function analyzeIncident() {
  const response = await fetch(
    `${API_BASE_URL}/incidents/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Incident analysis failed"
    );
  }

  return response.json();
}

export async function getLatestIncident() {
  const response = await fetch(
    `${API_BASE_URL}/incidents/latest`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch latest incident"
    );
  }

  return response.json();
}