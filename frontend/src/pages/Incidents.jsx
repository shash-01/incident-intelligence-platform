
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

const API_URL = "http://127.0.0.1:8003";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState("all");

  async function fetchIncidents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/incidents/history`);

      if (!response.ok) {
        throw new Error("Failed to fetch incident history.");
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.message || "Failed to load incidents."
        );
      }

      setIncidents(data.incidents || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncidents();

    const interval = setInterval(() => {
      fetchIncidents();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filter the existing incident history by service.
  const filteredIncidents =
    selectedService === "all"
      ? incidents
      : incidents.filter((incident) => {
          const service = (incident.service || "")
            .toLowerCase()
            .trim();

          return service === selectedService;
        });

  // Summary cards use the selected service's incidents.
  const peakCpu =
    filteredIncidents.length > 0
      ? Math.max(
          ...filteredIncidents.map(
            (item) => Number(item.cpu) || 0
          )
        ).toFixed(2) + "%"
      : "--";

  const peakLatency =
    filteredIncidents.length > 0
      ? Math.max(
          ...filteredIncidents.map(
            (item) => Number(item.latency) || 0
          )
        ).toFixed(3) + " s"
      : "--";

  const latestAffectedService =
    filteredIncidents.length > 0
      ? filteredIncidents[0].service || "Unknown"
      : "--";

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: 1800,
        mx: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ letterSpacing: "-0.8px" }}
          >
            Incidents
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Detected anomalies and incident history.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress size={17} color="inherit" />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          onClick={fetchIncidents}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Service filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Filter Incidents
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Select a microservice to view its recorded incidents.
              </Typography>
            </Box>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 240 } }}
            >
              <InputLabel id="service-filter-label">
                Service
              </InputLabel>

              <Select
                labelId="service-filter-label"
                id="service-filter"
                value={selectedService}
                label="Service"
                onChange={(event) =>
                  setSelectedService(event.target.value)
                }
              >
                <MenuItem value="all">All Services</MenuItem>
                <MenuItem value="user-service">
                  User Service
                </MenuItem>
                <MenuItem value="order-service">
                  Order Service
                </MenuItem>
                <MenuItem value="payment-service">
                  Payment Service
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Detected Incidents"
            value={filteredIncidents.length}
            subtitle={
              selectedService === "all"
                ? "Meaningful anomalies across services"
                : "Anomalies for selected service"
            }
            icon={<WarningAmberRoundedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Affected Service"
            value={latestAffectedService}
            subtitle="Latest affected service in this view"
            icon={<MemoryRoundedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Peak CPU"
            value={peakCpu}
            subtitle="Highest recorded CPU"
            icon={<SpeedRoundedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Peak Latency"
            value={peakLatency}
            subtitle="Highest recorded latency"
            icon={<TimelineRoundedIcon />}
          />
        </Grid>
      </Grid>

      {/* Incident Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Incident History
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Recorded anomalies from the ML pipeline.
              </Typography>
            </Box>

            <Chip
              icon={<WarningAmberRoundedIcon />}
              label={`${filteredIncidents.length} incidents`}
              size="small"
              color="warning"
              variant="outlined"
            />
          </Box>

          <Divider />

          {loading && incidents.length === 0 ? (
            <Box
              sx={{
                height: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredIncidents.length === 0 ? (
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1,
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                color="text.secondary"
              >
                No incidents found
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedService === "all"
                  ? "The incident history contains no recorded anomalies."
                  : `No recorded incidents were found for ${selectedService}.`}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">CPU</TableCell>
                    <TableCell align="right">Latency</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Errors</TableCell>
                    <TableCell align="right">Anomaly Score</TableCell>
                    <TableCell>Detection</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredIncidents.map((incident, index) => (
                    <IncidentRow
                      key={`${incident.timestamp}-${incident.service}-${index}`}
                      incident={incident}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function IncidentRow({ incident }) {
  const cpu = Number(incident.cpu) || 0;
  const latency = Number(incident.latency) || 0;
  const requestRate = Number(incident.request_rate) || 0;
  const errorRate = Number(incident.error_rate) || 0;
  const anomalyScore = Number(incident.anomaly_score) || 0;

  return (
    <TableRow
      hover
      sx={{
        "&:last-child td, &:last-child th": {
          border: 0,
        },
      }}
    >
      {/* Status */}
      <TableCell>
        <Chip
          label="ANOMALY"
          size="small"
          color="error"
          sx={{
            fontWeight: 700,
            fontSize: "0.68rem",
          }}
        />
      </TableCell>

      {/* Timestamp */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {formatTimestamp(incident.timestamp)}
        </Typography>
      </TableCell>

      {/* Service */}
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {incident.service || "Unknown"}
        </Typography>
      </TableCell>

      {/* CPU */}
      <TableCell align="right">
        <MetricValue
          value={`${cpu.toFixed(2)}%`}
          critical={cpu > 20}
        />
      </TableCell>

      {/* Latency */}
      <TableCell align="right">
        <MetricValue
          value={`${latency.toFixed(3)} s`}
          critical={latency > 1}
        />
      </TableCell>

      {/* Request Rate */}
      <TableCell align="right">
        {requestRate.toFixed(3)}
      </TableCell>

      {/* Error Rate */}
      <TableCell align="right">
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {errorRate > 0 && (
            <Tooltip title="Non-zero error rate">
              <ErrorOutlineRoundedIcon
                sx={{
                  fontSize: 16,
                  color: "error.main",
                }}
              />
            </Tooltip>
          )}

          {errorRate.toFixed(3)}
        </Box>
      </TableCell>

      {/* Anomaly Score */}
      <TableCell align="right">
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color:
              anomalyScore < -0.15
                ? "error.main"
                : "warning.main",
          }}
        >
          {anomalyScore.toFixed(4)}
        </Typography>
      </TableCell>

      {/* Detection */}
      <TableCell>
        <Chip
          label={
            incident.baseline_label ||
            incident.predicted_label ||
            "Anomaly"
          }
          size="small"
          color="error"
          variant="outlined"
        />
      </TableCell>
    </TableRow>
  );
}

function MetricValue({ value, critical }) {
  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        color: critical ? "error.main" : "text.primary",
      }}
    >
      {value}
    </Typography>
  );
}

function SummaryCard({ title, value, subtitle, icon }) {
  return (
    <Card
      sx={{
        height: "100%",
        transition:
          "transform 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(99, 102, 241, 0.4)",
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
              backgroundColor: "rgba(99, 102, 241, 0.10)",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            letterSpacing: "-0.5px",
            wordBreak: "break-word",
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

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(
    timestamp.replace(" ", "T")
  );

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}
