import { Box, Card, CardContent, Typography } from "@mui/material";

export default function MetricCard({
  title,
  value,
  unit = "",
  subtitle,
  icon,
  status = "normal",
}) {
  const statusColor = {
    normal: "#22c55e",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(99, 102, 241, 0.4)",
        },
      }}
    >
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
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 36,
              height: 36,
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

        {/* Value */}
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: 0.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            {value}
          </Typography>

          {unit && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {unit}
            </Typography>
          )}
        </Box>

        {/* Status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            mt: 1.5,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: statusColor[status],
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}