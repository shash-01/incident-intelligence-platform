import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";

export default function LogsPanel({ logs = [] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <TerminalRoundedIcon
              sx={{
                color: "secondary.main",
              }}
            />

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Incident Logs
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Logs retrieved from Loki
              </Typography>
            </Box>
          </Box>

          <Chip
            label={`${logs.length} logs`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Logs */}
        {logs.length === 0 ? (
          <Box
            sx={{
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">
              No logs available for this incident.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 320,
              overflowY: "auto",
              pr: 1,

              "&::-webkit-scrollbar": {
                width: 6,
              },

              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#334155",
                borderRadius: 3,
              },
            }}
          >
            {logs.map((log, index) => (
              <Box
                key={`${log.timestamp}-${index}`}
                sx={{
                  mb: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor:
                    "rgba(15, 23, 42, 0.7)",
                  border:
                    "1px solid rgba(148, 163, 184, 0.08)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    mb: 0.5,
                    fontFamily: "monospace",
                  }}
                >
                  {formatTimestamp(log.timestamp)}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: getLogColor(
                      log.message
                    ),
                    wordBreak: "break-word",
                  }}
                >
                  {log.message}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }

  try {
    const date = new Date(
      Number(timestamp) / 1_000_000
    );

    return date.toLocaleTimeString();
  } catch {
    return timestamp;
  }
}

function getLogColor(message = "") {
  const text = message.toLowerCase();

  if (
    text.includes("error") ||
    text.includes("exception") ||
    text.includes("failed")
  ) {
    return "#ef4444";
  }

  if (
    text.includes("warning") ||
    text.includes("stress")
  ) {
    return "#f59e0b";
  }

  return "#cbd5e1";
}