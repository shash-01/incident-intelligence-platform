import {
  Alert,
  Box,
  Chip,
  Typography,
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export default function IncidentHeader({
  incident,
  loading = false,
}) {
  if (loading) {
    return (
      <Alert severity="info">
        Analyzing the current system state...
      </Alert>
    );
  }

  if (!incident) {
    return (
      <Alert severity="success">
        <Typography fontWeight={600}>
          System operating normally
        </Typography>
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid rgba(239, 68, 68, 0.25)",
        background:
          "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(17,24,32,0.8))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: {
            xs: "column",
            md: "row",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(239,68,68,0.15)",
              color: "error.main",
            }}
          >
            <WarningAmberRoundedIcon />
          </Box>

          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Active Incident Detected
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              AI-driven incident analysis is available
            </Typography>
          </Box>
        </Box>

        <Chip
          label="ANOMALY"
          color="error"
          size="small"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
        }}
      >
        <Chip
          label={`Service: ${incident.service || "Unknown"}`}
          variant="outlined"
          size="small"
        />

        <Chip
          label={`Severity: ${
            incident.severity !== undefined
              ? incident.severity.toFixed(2)
              : "N/A"
          }`}
          variant="outlined"
          size="small"
        />

        <Chip
          label={`Feature: ${
            incident.dominant_feature || "Unknown"
          }`}
          variant="outlined"
          size="small"
        />
      </Box>
    </Box>
  );
}