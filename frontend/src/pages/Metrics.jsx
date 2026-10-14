import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = "http://127.0.0.1:8003";

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchMetrics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/metrics/current`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch Prometheus metrics."
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          "Prometheus returned an invalid response."
        );
      }

      const current = data.metrics;

      setMetrics(current);

      setHistory((previous) => {
        const point = {
          time: new Date().toLocaleTimeString(),
          cpu: Number(current.cpu || 0),
          requestRate: Number(
            current.request_rate || 0
          ),
          latency:
            Number(current.latency || 0) * 1000,
        };

        return [...previous, point].slice(-20);
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to fetch metrics from backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(
      fetchMetrics,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  function formatMemory(bytes) {
    if (!bytes) {
      return "0 MB";
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        maxWidth: 1800,
        mx: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          flexDirection: {
            xs: "column",
            md: "row",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.8px",
            }}
          >
            Metrics
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Live performance metrics from Prometheus.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress
                size={17}
                color="inherit"
              />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          onClick={fetchMetrics}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Metric Cards */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <MetricSummaryCard
            title="CPU Utilization"
            value={
              metrics
                ? `${Number(
                    metrics.cpu || 0
                  ).toFixed(2)}%`
                : "--"
            }
            subtitle="Across monitored services"
            icon={<MemoryRoundedIcon />}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <MetricSummaryCard
            title="Memory Usage"
            value={
              metrics
                ? formatMemory(
                    metrics.memory
                  )
                : "--"
            }
            subtitle="Process resident memory"
            icon={<MemoryRoundedIcon />}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <MetricSummaryCard
            title="Request Rate"
            value={
              metrics
                ? `${Number(
                    metrics.request_rate || 0
                  ).toFixed(2)} req/s`
                : "--"
            }
            subtitle="Requests per second"
            icon={<TimelineRoundedIcon />}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <MetricSummaryCard
            title="Error Rate"
            value={
              metrics
                ? `${Number(
                    metrics.error_rate || 0
                  ).toFixed(2)} req/s`
                : "--"
            }
            subtitle="4xx / 5xx responses"
            icon={<ErrorOutlineRoundedIcon />}
          />
        </Grid>
      </Grid>

      {/* Latency */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <MetricSummaryCard
            title="Average Latency"
            value={
              metrics
                ? `${(
                    Number(
                      metrics.latency || 0
                    ) * 1000
                  ).toFixed(2)} ms`
                : "--"
            }
            subtitle="Average request duration"
            icon={<SpeedRoundedIcon />}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 8,
          }}
        >
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                CPU & Request Rate
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Recent observations from Prometheus
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  height: 280,
                }}
              >
                {history.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={history}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.10)"
                      />

                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        stroke="#64748b"
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 11,
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            "#111820",
                          border:
                            "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 8,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="cpu"
                        name="CPU %"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="requestRate"
                        name="Request Rate"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Latency Chart */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Request Latency
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Average latency over the latest observations
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 300,
            }}
          >
            {history.length > 0 && (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={history}
                  margin={{
                    top: 5,
                    right: 20,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.10)"
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    unit=" ms"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111820",
                      border:
                        "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(
                        2
                      )} ms`,
                      "Latency",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="latency"
                    name="Latency"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


function MetricSummaryCard({
  title,
  value,
  subtitle,
  icon,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        transition:
          "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor:
            "rgba(99, 102, 241, 0.4)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                "rgba(99, 102, 241, 0.10)",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 1,
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}