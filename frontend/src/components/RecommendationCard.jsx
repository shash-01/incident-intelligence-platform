import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export default function RecommendationCard({ llm }) {
  if (!llm || !llm.analysis) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>
            AI Recommendation
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            No AI recommendation available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        borderColor: "rgba(99, 102, 241, 0.25)",
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(17,24,32,0.9))",
      }}
    >
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
            <AutoAwesomeRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: 28,
              }}
            />

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                AI Recommendation
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Agentic RAG + LLM analysis
              </Typography>
            </Box>
          </Box>

          <Chip
            label={llm.source || "AI"}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Analysis */}
        <Box
          sx={{
            maxHeight: 420,
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
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
              color: "text.primary",
            }}
          >
            {llm.analysis}
          </Typography>
        </Box>

        {/* Grounding note */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor:
              "rgba(34, 211, 238, 0.06)",
            border:
              "1px solid rgba(34, 211, 238, 0.12)",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            AI analysis is grounded in anomaly metrics,
            SHAP explanations, Loki logs, and retrieved
            troubleshooting knowledge.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}