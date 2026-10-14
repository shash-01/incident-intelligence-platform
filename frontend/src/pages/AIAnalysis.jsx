import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AutoAwesome,
  CheckCircle,
  Error,
  Psychology,
  Refresh,
  Search,
  Storage,
  WarningAmber,
} from "@mui/icons-material";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyzeIncident } from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  return number.toFixed(decimals);
}

function formatMemory(bytes) {
  if (!bytes) {
    return "0 MB";
  }

  return `${(Number(bytes) / 1024 / 1024).toFixed(1)} MB`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "-";
  }

  try {
    return new Date(
      timestamp.replace(" ", "T")
    ).toLocaleString();
  } catch {
    return timestamp;
  }
}

function formatLokiTimestamp(timestamp) {
  if (!timestamp) {
    return "-";
  }

  try {
    const milliseconds = Number(
      BigInt(timestamp) / 1000000n
    );

    return new Date(milliseconds).toLocaleString();
  } catch {
    return timestamp;
  }
}

function formatFeatureName(feature) {
  if (!feature) {
    return "-";
  }

  return feature
    .replace(/\_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLevelFromLog(log) {
  const message = (log.message || "").toUpperCase();

  if (
    message.includes("ERROR") ||
    message.includes("EXCEPTION") ||
    message.includes("FAILED")
  ) {
    return "ERROR";
  }

  if (
    message.includes("WARNING") ||
    message.includes("WARN") ||
    message.includes("STRESS")
  ) {
    return "WARNING";
  }

  return "INFO";
}

function getLevelColor(level) {
  if (level === "ERROR") {
    return "error";
  }

  if (level === "WARNING") {
    return "warning";
  }

  return "success";
}

/* =========================================================
   LLM RESPONSE PARSER
========================================================= */

function parseLLMAnalysis(text = "") {
  const sections = {
    rootCause: "",
    evidence: "",
    anomalyExplanation: "",
    recommendation: "",
    verification: "",
    confidence: "",
  };

  const normalized = text
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .trim();

  const markers = [
    ["rootCause", "ROOT CAUSE:"],
    ["evidence", "EVIDENCE:"],
    ["anomalyExplanation", "ANOMALY EXPLANATION:"],
    ["recommendation", "RECOMMENDATION:"],
    ["verification", "VERIFICATION:"],
    ["confidence", "CONFIDENCE:"],
  ];

  markers.forEach(([key, marker], index) => {
    const start = normalized.indexOf(marker);

    if (start === -1) {
      return;
    }

    const contentStart = start + marker.length;

    let contentEnd = normalized.length;

    for (let i = index + 1; i < markers.length; i++) {
      const nextMarker = normalized.indexOf(
        markers[i][1],
        contentStart
      );

      if (nextMarker !== -1) {
        contentEnd = nextMarker;
        break;
      }
    }

    sections[key] = normalized
      .slice(contentStart, contentEnd)
      .trim();
  });

  return sections;
}

function cleanLine(line) {
  return line
    .replace(/^[-•]\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/`/g, "")
    .trim();
}

function getLines(text = "") {
  return text
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);
}

/* =========================================================
   LLM SECTION
========================================================= */

function AISection({
  title,
  icon,
  children,
  color = "primary",
}) {
  return (
    <Paper
      sx={{
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              color === "warning"
                ? "rgba(237,108,2,0.12)"
                : color === "success"
                ? "rgba(46,125,50,0.12)"
                : "rgba(99,102,241,0.12)",
            color:
              color === "warning"
                ? "warning.main"
                : color === "success"
                ? "success.main"
                : "primary.main",
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={700}
        >
          {title}
        </Typography>
      </Stack>

      {children}
    </Paper>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  unit,
  icon,
}) {
  return (
    <Paper
      sx={{
        p: 2.5,
        flex: 1,
        minWidth: 180,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {title}
          </Typography>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            {value}

            {unit && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                {unit}
              </Typography>
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 2,
            backgroundColor:
              "rgba(99, 102, 241, 0.12)",
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
      >
        {icon}

        <Typography
          variant="h6"
          fontWeight={700}
        >
          {title}
        </Typography>
      </Stack>

      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

/* =========================================================
   AI ANALYSIS PAGE
========================================================= */

export default function AIAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     RUN ANALYSIS
  ======================================================= */

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await analyzeIncident();

      setAnalysis(result);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to perform AI incident analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     RESPONSE DATA
  ======================================================= */

  const incident = analysis?.incident;
  const rootCause = analysis?.root_cause;
  const shap = analysis?.shap || [];
  const knowledge = analysis?.knowledge || [];
  const logs = incident?.logs || [];
  const llm = analysis?.llm;

  /* =======================================================
     SHAP DATA
  ======================================================= */

  const shapData = shap.map((item) => ({
    feature: formatFeatureName(item.feature),
    value: Number(item.absolute_contribution),
    originalValue: Number(item.shap_value),
  }));

  /* =======================================================
     PARSE LLM RESPONSE
  ======================================================= */

  const llmSections = parseLLMAnalysis(
    llm?.analysis || ""
  );

  const recommendationLines = getLines(
    llmSections.recommendation
  );

  const verificationLines = getLines(
    llmSections.verification
  );

  const evidenceLines = getLines(
    llmSections.evidence
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box>
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          gap: 2,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            AI Incident Analysis
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Explainable anomaly detection, root cause
            analysis and AI-powered recommendations
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <AutoAwesome />
            )
          }
          onClick={runAnalysis}
          disabled={loading}
          sx={{
            minWidth: 160,
            height: 42,
            fontWeight: 600,
          }}
        >
          {loading
            ? "Analyzing..."
            : "Analyze Incident"}
        </Button>
      </Box>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* ===================================================
          INITIAL STATE
      =================================================== */}

      {!analysis && !loading && (
        <Paper
          sx={{
            p: 7,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              backgroundColor:
                "rgba(99, 102, 241, 0.12)",
              color: "primary.main",
            }}
          >
            <Psychology sx={{ fontSize: 38 }} />
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
          >
            Ready for Incident Analysis
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: "auto",
              mt: 1,
              mb: 3,
            }}
          >
            Run the AI analysis pipeline to detect the
            latest anomaly, explain the contributing
            features, inspect logs, determine the probable
            root cause, retrieve troubleshooting knowledge
            and generate an AI recommendation.
          </Typography>

          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={runAnalysis}
          >
            Run AI Analysis
          </Button>
        </Paper>
      )}

      {/* ===================================================
          LOADING
      =================================================== */}

      {loading && (
        <Paper
          sx={{
            p: 7,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CircularProgress
            size={42}
            sx={{ mb: 2 }}
          />

          <Typography
            variant="h6"
            fontWeight={600}
          >
            Investigating incident...
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Running anomaly detection, SHAP explanation,
            log investigation, RAG retrieval and LLM
            analysis.
          </Typography>
        </Paper>
      )}

      {/* ===================================================
          ANALYSIS RESULT
      =================================================== */}

      {analysis && !loading && (
        <Stack spacing={3}>

          {/* =================================================
              INCIDENT HEADER
          ================================================= */}

          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                md: "center",
              }}
              spacing={2}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <WarningAmber color="warning" />

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Incident Detected
                  </Typography>

                  <Chip
                    label="ANOMALY"
                    color="error"
                    size="small"
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {incident?.anomaly_type}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  label={incident?.service}
                  color="primary"
                  variant="outlined"
                />

                <Chip
                  label={`Severity ${formatNumber(
                    incident?.incident_severity
                  )}`}
                  color="warning"
                  variant="outlined"
                />

                <Chip
                  label={formatTimestamp(
                    incident?.timestamp
                  )}
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Paper>

          {/* =================================================
              METRICS
          ================================================= */}

          <Box>
            <SectionHeader
              icon={
                <CheckCircle color="primary" />
              }
              title="Incident Metrics"
              subtitle="Operational metrics captured at the time of anomaly detection"
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              flexWrap="wrap"
            >
              <MetricCard
                title="CPU Usage"
                value={formatNumber(
                  incident?.metrics?.cpu
                )}
                unit="%"
                icon={<Storage />}
              />

              <MetricCard
                title="Latency"
                value={formatNumber(
                  incident?.metrics?.latency
                )}
                unit="s"
                icon={<WarningAmber />}
              />

              <MetricCard
                title="Request Rate"
                value={formatNumber(
                  incident?.metrics?.request_rate
                )}
                unit="req/s"
                icon={<Refresh />}
              />

              <MetricCard
                title="Error Rate"
                value={formatNumber(
                  incident?.metrics?.error_rate
                )}
                unit="%"
                icon={<Error />}
              />

              <MetricCard
                title="Memory"
                value={formatMemory(
                  incident?.metrics?.memory
                )}
                icon={<Storage />}
              />
            </Stack>
          </Box>

          {/* =================================================
              SHAP + DETECTION DETAILS
          ================================================= */}

          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            spacing={3}
          >

            {/* SHAP */}

            <Paper
              sx={{
                p: 3,
                flex: 1.5,
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionHeader
                icon={
                  <Psychology color="primary" />
                }
                title="SHAP Anomaly Explanation"
                subtitle="Feature contributions influencing the anomaly model"
              />

              <Box
                sx={{
                  width: "100%",
                  height: 300,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.15}
                    />

                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        Number(value).toFixed(3),
                        "Absolute Contribution",
                      ]}
                    />

                    <Bar
                      dataKey="value"
                      radius={[
                        0,
                        5,
                        5,
                        0,
                      ]}
                    >
                      {shapData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0
                                ? "#f59e0b"
                                : "#6366f1"
                            }
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Dominant Feature
                </Typography>

                <Chip
                  label={formatFeatureName(
                    incident?.dominant_feature || "-"
                  )}
                  color="warning"
                  size="small"
                />
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mt: 2,
                }}
              >
                SHAP values indicate model contribution
                toward the anomaly decision; they do not
                establish causality by themselves.
              </Typography>
            </Paper>

            {/* DETECTION DETAILS */}

            <Paper
              sx={{
                p: 3,
                flex: 1,
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionHeader
                icon={
                  <AutoAwesome color="primary" />
                }
                title="Detection Details"
                subtitle="Machine learning incident context"
              />

              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Anomaly Score
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ mt: 0.5 }}
                  >
                    {formatNumber(
                      incident?.anomaly_score,
                      4
                    )}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Incident Severity
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ mt: 0.5 }}
                  >
                    {formatNumber(
                      incident?.incident_severity
                    )}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Detection Method
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ mt: 0.5 }}
                  >
                    Isolation Forest
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Explainability
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ mt: 0.5 }}
                  >
                    SHAP
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* =================================================
              ROOT CAUSE
          ================================================= */}

          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "warning.main",
              backgroundColor:
                "rgba(237, 108, 2, 0.04)",
            }}
          >
            <SectionHeader
              icon={
                <Search color="warning" />
              }
              title="Probable Root Cause"
              subtitle="Root Cause Agent analysis using incident metrics and Loki evidence"
            />

            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              {rootCause?.root_cause}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Chip
                label={`Confidence: ${
                  rootCause?.confidence ||
                  "Unknown"
                }`}
                color={
                  rootCause?.confidence === "High"
                    ? "success"
                    : "warning"
                }
              />
            </Stack>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              Evidence
            </Typography>

            <Stack spacing={1}>
              {(rootCause?.evidence || []).map(
                (item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor:
                        "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        wordBreak: "break-word",
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                )
              )}
            </Stack>
          </Paper>

          {/* =================================================
              LOG EVIDENCE
          ================================================= */}

          <Paper
            sx={{
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ p: 3 }}>
              <SectionHeader
                icon={
                  <Storage color="primary" />
                }
                title="Incident Log Evidence"
                subtitle={`${logs.length} Loki log entries correlated with the incident`}
              />
            </Box>

            <Box>
              {logs.map((log, index) => {
                const level =
                  getLevelFromLog(log);

                return (
                  <Box
                    key={`${log.timestamp}-${index}`}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      backgroundColor:
                        level === "WARNING"
                          ? "rgba(237,108,2,0.05)"
                          : level === "ERROR"
                          ? "rgba(211,47,47,0.05)"
                          : "transparent",
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        md: "row",
                      }}
                      spacing={2}
                      alignItems={{
                        md: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          minWidth: 175,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatLokiTimestamp(
                          log.timestamp
                        )}
                      </Typography>

                      <Chip
                        label={
                          log.labels
                            ?.service_name ||
                          incident?.service ||
                          "unknown"
                        }
                        size="small"
                        variant="outlined"
                      />

                      <Chip
                        label={level}
                        size="small"
                        color={getLevelColor(
                          level
                        )}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          wordBreak:
                            "break-word",
                          flex: 1,
                        }}
                      >
                        {log.message}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* =================================================
              RAG KNOWLEDGE
          ================================================= */}

          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <SectionHeader
              icon={
                <Storage color="primary" />
              }
              title="Retrieved Knowledge"
              subtitle="Troubleshooting knowledge retrieved from ChromaDB using RAG"
            />

            <Stack spacing={2}>
              {knowledge.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor:
                      "background.default",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                    >
                      {formatFeatureName(
                        item.id
                      )}
                    </Typography>

                    <Chip
                      label="RAG"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.document?.trim()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* =================================================
              AI RECOMMENDATION
          ================================================= */}

          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "primary.main",
              backgroundColor:
                "rgba(99,102,241,0.04)",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <SectionHeader
                icon={
                  <AutoAwesome
                    color="primary"
                  />
                }
                title="AI Recommendation"
                subtitle="Grounded analysis generated using incident evidence and retrieved knowledge"
              />

              <Chip
                label={llm?.source || "LLM"}
                color="primary"
                size="small"
              />
            </Stack>

            <Stack spacing={2}>

              {/* ROOT CAUSE */}

              {llmSections.rootCause && (
                <AISection
                  title="Root Cause"
                  icon={
                    <Search fontSize="small" />
                  }
                  color="warning"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.8,
                    }}
                  >
                    {llmSections.rootCause}
                  </Typography>
                </AISection>
              )}

              {/* EVIDENCE */}

              {llmSections.evidence && (
                <AISection
                  title="Evidence"
                  icon={
                    <Storage fontSize="small" />
                  }
                >
                  <Stack spacing={1}>
                    {evidenceLines.length > 0 ? (
                      evidenceLines.map(
                        (line, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              backgroundColor:
                                "background.default",
                              border: "1px solid",
                              borderColor:
                                "divider",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.7,
                              }}
                            >
                              {line}
                            </Typography>
                          </Box>
                        )
                      )
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace:
                            "pre-line",
                          lineHeight: 1.8,
                        }}
                      >
                        {
                          llmSections.evidence
                        }
                      </Typography>
                    )}
                  </Stack>
                </AISection>
              )}

              {/* ANOMALY EXPLANATION */}

              {llmSections.anomalyExplanation && (
                <AISection
                  title="Anomaly Explanation"
                  icon={
                    <Psychology fontSize="small" />
                  }
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.8,
                    }}
                  >
                    {
                      llmSections.anomalyExplanation
                    }
                  </Typography>
                </AISection>
              )}

              {/* RECOMMENDATION */}

              {llmSections.recommendation && (
                <AISection
                  title="Recommended Actions"
                  icon={
                    <CheckCircle fontSize="small" />
                  }
                  color="success"
                >
                  <Stack spacing={1.5}>
                    {recommendationLines.length > 0 ? (
                      recommendationLines.map(
                        (line, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              gap: 1.5,
                              alignItems:
                                "flex-start",
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                backgroundColor:
                                  "rgba(46,125,50,0.12)",
                                color:
                                  "success.main",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {index + 1}
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{
                                flex: 1,
                                lineHeight: 1.7,
                                pt: 0.4,
                              }}
                            >
                              {line}
                            </Typography>
                          </Box>
                        )
                      )
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace:
                            "pre-line",
                          lineHeight: 1.8,
                        }}
                      >
                        {
                          llmSections.recommendation
                        }
                      </Typography>
                    )}
                  </Stack>
                </AISection>
              )}

              {/* VERIFICATION */}

              {llmSections.verification && (
                <AISection
                  title="Verification Plan"
                  icon={
                    <Refresh fontSize="small" />
                  }
                >
                  <Stack spacing={1.2}>
                    {verificationLines.length > 0 ? (
                      verificationLines.map(
                        (line, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              gap: 1.5,
                              alignItems:
                                "flex-start",
                            }}
                          >
                            <CheckCircle
                              sx={{
                                mt: 0.25,
                                fontSize: 19,
                                color:
                                  "primary.main",
                              }}
                            />

                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.7,
                              }}
                            >
                              {line}
                            </Typography>
                          </Box>
                        )
                      )
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace:
                            "pre-line",
                          lineHeight: 1.8,
                        }}
                      >
                        {
                          llmSections.verification
                        }
                      </Typography>
                    )}
                  </Stack>
                </AISection>
              )}

              {/* CONFIDENCE */}

              {llmSections.confidence && (
                <AISection
                  title="AI Confidence"
                  icon={
                    <WarningAmber fontSize="small" />
                  }
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.8,
                    }}
                  >
                    {llmSections.confidence}
                  </Typography>
                </AISection>
              )}

              {/* FALLBACK */}

              {!llmSections.rootCause &&
                !llmSections.evidence &&
                !llmSections.anomalyExplanation &&
                !llmSections.recommendation &&
                !llmSections.verification &&
                !llmSections.confidence && (
                  <AISection
                    title="AI Analysis"
                    icon={
                      <AutoAwesome fontSize="small" />
                    }
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-line",
                        lineHeight: 1.8,
                      }}
                    >
                      {llm?.analysis ||
                        "No LLM analysis available."}
                    </Typography>
                  </AISection>
                )}
            </Stack>

            <Alert
              severity="info"
              sx={{ mt: 2 }}
            >
              The recommendation is generated from the
              detected incident, SHAP explanation, Loki
              evidence and retrieved troubleshooting
              knowledge. It does not perform automatic
              remediation.
            </Alert>
          </Paper>

          {/* =================================================
              FOOTER STATUS
          ================================================= */}

          <Paper
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{
                sm: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Analysis pipeline completed successfully
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  label="Isolation Forest"
                  size="small"
                  variant="outlined"
                />

                <Chip
                  label="SHAP"
                  size="small"
                  variant="outlined"
                />

                <Chip
                  label="Loki"
                  size="small"
                  variant="outlined"
                />

                <Chip
                  label="ChromaDB / RAG"
                  size="small"
                  variant="outlined"
                />

                <Chip
                  label="Groq LLM"
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Paper>

        </Stack>
      )}
    </Box>
  );
}