import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function RootCauseCard({ rootCause }) {
  if (!rootCause) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>
            Root Cause Analysis
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            No root cause analysis available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <PsychologyRoundedIcon
              sx={{
                color: "secondary.main",
                fontSize: 28,
              }}
            />

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Root Cause Analysis
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                AI-assisted investigation
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<CheckCircleRoundedIcon />}
            label={rootCause.confidence || "Unknown"}
            color={
              rootCause.confidence === "High"
                ? "success"
                : "warning"
            }
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Root cause */}
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 0.8 }}
        >
          Probable Root Cause
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          {rootCause.root_cause ||
            "Root cause unavailable."}
        </Typography>

        {/* Evidence */}
        {rootCause.evidence &&
          rootCause.evidence.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 2.5, mb: 1 }}
              >
                Evidence
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {rootCause.evidence.map(
                  (evidence, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 1.5,
                        py: 1.2,
                        borderRadius: 1.5,
                        backgroundColor:
                          "rgba(148, 163, 184, 0.06)",
                        border:
                          "1px solid rgba(148, 163, 184, 0.08)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily:
                            "monospace",
                          color: "text.secondary",
                          wordBreak: "break-word",
                        }}
                      >
                        {typeof evidence ===
                        "string"
                          ? evidence
                          : evidence.message ||
                            JSON.stringify(
                              evidence
                            )}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            </>
          )}
      </CardContent>
    </Card>
  );
}