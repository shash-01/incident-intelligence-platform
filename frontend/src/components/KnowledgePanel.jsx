import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

export default function KnowledgePanel({ knowledge = [] }) {
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
            <MenuBookRoundedIcon
              sx={{
                color: "primary.main",
              }}
            />

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Retrieved Knowledge
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                RAG context from ChromaDB
              </Typography>
            </Box>
          </Box>

          <Chip
            label={`${knowledge.length} sources`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {knowledge.length === 0 ? (
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">
              No knowledge retrieved.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {knowledge.map((item, index) => (
              <Box
                key={item.id || index}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor:
                    "rgba(99, 102, 241, 0.06)",
                  border:
                    "1px solid rgba(99, 102, 241, 0.12)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 0.8,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {formatTitle(item.id)}
                  </Typography>

                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                  }}
                >
                  {item.document ||
                    "No document content available."}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function formatTitle(id) {
  if (!id) {
    return "Knowledge Source";
  }

  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}
