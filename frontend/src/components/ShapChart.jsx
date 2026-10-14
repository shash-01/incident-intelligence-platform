import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ShapChart({ data = [] }) {
  const chartData = data.map((item) => ({
    feature: item.feature,
    contribution: Number(item.shap_value),
    absolute: Number(item.absolute_contribution),
  }));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          Anomaly Explanation
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, mb: 2 }}
        >
          SHAP feature contributions
        </Typography>

        {chartData.length === 0 ? (
          <Box
            sx={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">
              No explanation data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.10)"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#64748b"
                  tick={{
                    fill: "#cbd5e1",
                    fontSize: 12,
                  }}
                  width={90}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111820",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 8,
                    color: "#f8fafc",
                  }}
                  formatter={(value) => [
                    Number(value).toFixed(3),
                    "SHAP",
                  ]}
                />

                <Bar
                  dataKey="contribution"
                  radius={[0, 5, 5, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.contribution < 0
                          ? "#ef4444"
                          : "#22c55e"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}