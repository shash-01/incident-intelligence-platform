import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AccessTime,
  Error,
  FilterList,
  Refresh,
  Search,
  Storage,
  WarningAmber,
} from "@mui/icons-material";

const API_BASE_URL = "http://127.0.0.1:8003";

/* =========================================================
   HELPERS
========================================================= */

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "-";
  }

  try {
    const value = Number(timestamp);

    if (!Number.isNaN(value)) {
      return new Date(
        value / 1_000_000
      ).toLocaleString();
    }

    return new Date(
      timestamp
    ).toLocaleString();
  } catch {
    return timestamp;
  }
}

function getLogLevel(message = "") {
  const text = message.toUpperCase();

  if (
    text.includes("ERROR") ||
    text.includes("EXCEPTION") ||
    text.includes("FAILED")
  ) {
    return "ERROR";
  }

  if (
    text.includes("WARNING") ||
    text.includes("WARN") ||
    text.includes("STRESS")
  ) {
    return "WARNING";
  }

  if (text.includes("DEBUG")) {
    return "DEBUG";
  }

  return "INFO";
}

function getLevelColor(level) {
  switch (level) {
    case "ERROR":
      return "error";

    case "WARNING":
      return "warning";

    case "DEBUG":
      return "default";

    default:
      return "success";
  }
}

function getServiceColor(service) {
  switch (service) {
    case "user-service":
      return "primary";

    case "order-service":
      return "info";

    case "payment-service":
      return "success";

    default:
      return "default";
  }
}

function getLogMessage(log) {
  return log.message || "";
}

function getServiceName(log) {
  return (
    log.service_name ||
    log.labels?.service_name ||
    log.labels?.container ||
    "unknown"
  );
}

/* =========================================================
   LOGS PAGE
========================================================= */

export default function Logs() {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [serviceFilter, setServiceFilter] =
    useState("all");

  const [levelFilter, setLevelFilter] =
    useState("all");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  /* =======================================================
     FETCH LOGS
  ======================================================= */

  const fetchLogs = async (
    showLoading = false
  ) => {
    try {
      if (showLoading) {
        setRefreshing(true);
      }

      const response = await fetch(
        `${API_BASE_URL}/logs/recent?minutes=30&limit=100`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch logs (${response.status})`
        );
      }

      const data =
        await response.json();

      setLogs(data.logs || []);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load logs."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     FILTER LOGS
  ======================================================= */

  const filteredLogs = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return logs.filter((log) => {
      const message =
        getLogMessage(log).toLowerCase();

      const service =
        getServiceName(log).toLowerCase();

      const level = getLogLevel(
        getLogMessage(log)
      );

      const matchesSearch =
        !searchValue ||
        message.includes(searchValue) ||
        service.includes(searchValue);

      const matchesService =
        serviceFilter === "all" ||
        service === serviceFilter;

      const matchesLevel =
        levelFilter === "all" ||
        level === levelFilter;

      return (
        matchesSearch &&
        matchesService &&
        matchesLevel
      );
    });
  }, [
    logs,
    search,
    serviceFilter,
    levelFilter,
  ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const infoCount = logs.filter(
    (log) =>
      getLogLevel(log.message) === "INFO"
  ).length;

  const warningCount = logs.filter(
    (log) =>
      getLogLevel(log.message) ===
      "WARNING"
  ).length;

  const errorCount = logs.filter(
    (log) =>
      getLogLevel(log.message) ===
      "ERROR"
  ).length;

  const services = [
    ...new Set(
      logs.map((log) =>
        getServiceName(log)
      )
    ),
  ].filter(Boolean);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box>
      {/* ===================================================
          HEADER
      =================================================== */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          gap: 2,
          flexDirection: {
            xs: "column",
            md: "row",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            Logs
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Centralized application logs from all
            microservices
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            refreshing ? (
              <CircularProgress
                size={17}
                color="inherit"
              />
            ) : (
              <Refresh />
            )
          }
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
        >
          Refresh
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
          SUMMARY CARDS
      =================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* TOTAL */}

        <Paper
          sx={{
            p: 2.5,
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Logs
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 0.5 }}
              >
                {logs.length}
              </Typography>
            </Box>

            <Storage color="primary" />
          </Stack>
        </Paper>

        {/* INFO */}

        <Paper
          sx={{
            p: 2.5,
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Info
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 0.5 }}
              >
                {infoCount}
              </Typography>
            </Box>

            <Chip
              label="INFO"
              color="success"
              size="small"
            />
          </Stack>
        </Paper>

        {/* WARNINGS */}

        <Paper
          sx={{
            p: 2.5,
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Warnings
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 0.5 }}
              >
                {warningCount}
              </Typography>
            </Box>

            <WarningAmber color="warning" />
          </Stack>
        </Paper>

        {/* ERRORS */}

        <Paper
          sx={{
            p: 2.5,
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Errors
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 0.5 }}
              >
                {errorCount}
              </Typography>
            </Box>

            <Error color="error" />
          </Stack>
        </Paper>
      </Stack>

      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
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
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <FilterList color="primary" />

            <Typography
              variant="subtitle2"
              fontWeight={600}
            >
              Filters
            </Typography>
          </Stack>

          {/* SEARCH */}

          <TextField
            size="small"
            placeholder="Search logs..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            sx={{
              flex: 1,
              minWidth: {
                md: 280,
              },
            }}
            InputProps={{
              startAdornment: (
                <Search
                  sx={{
                    mr: 1,
                    color: "text.secondary",
                  }}
                />
              ),
            }}
          />

          {/* SERVICE FILTER */}

          <FormControl
            size="small"
            sx={{
              minWidth: 180,
            }}
          >
            <InputLabel>
              Service
            </InputLabel>

            <Select
              value={serviceFilter}
              label="Service"
              onChange={(event) =>
                setServiceFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All Services
              </MenuItem>

              {services.map(
                (service) => (
                  <MenuItem
                    key={service}
                    value={service}
                  >
                    {service}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          {/* LEVEL FILTER */}

          <FormControl
            size="small"
            sx={{
              minWidth: 160,
            }}
          >
            <InputLabel>
              Level
            </InputLabel>

            <Select
              value={levelFilter}
              label="Level"
              onChange={(event) =>
                setLevelFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All Levels
              </MenuItem>

              <MenuItem value="INFO">
                Info
              </MenuItem>

              <MenuItem value="WARNING">
                Warnings
              </MenuItem>

              <MenuItem value="ERROR">
                Errors
              </MenuItem>

              <MenuItem value="DEBUG">
                Debug
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* FILTER STATUS */}

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5 }}
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Showing {filteredLogs.length} of{" "}
            {logs.length} logs
          </Typography>

          {lastUpdated && (
            <>
              <Divider
                orientation="vertical"
                flexItem
              />

              <AccessTime
                sx={{
                  fontSize: 15,
                  color: "text.secondary",
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Updated{" "}
                {lastUpdated.toLocaleTimeString()}
              </Typography>
            </>
          )}
        </Stack>
      </Paper>

      {/* ===================================================
          LOG TABLE
      =================================================== */}

      <Paper
        sx={{
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* TABLE HEADER */}

        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
          >
            Recent Logs
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.3 }}
          >
            Automatically refreshed every 5
            seconds
          </Typography>
        </Box>

        {/* LOADING */}

        {loading ? (
          <Box
            sx={{
              py: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Loading logs from Loki...
            </Typography>
          </Box>
        ) : filteredLogs.length === 0 ? (
          /* EMPTY */

          <Box
            sx={{
              p: 6,
              textAlign: "center",
            }}
          >
            <Storage
              sx={{
                fontSize: 42,
                color: "text.secondary",
                mb: 1,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={600}
            >
              No matching logs
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Try changing your search or
              filter settings.
            </Typography>
          </Box>
        ) : (
          /* LOG LIST */

          <Box>
            {filteredLogs.map(
              (log, index) => {
                const message =
                  getLogMessage(log);

                const level =
                  getLogLevel(message);

                const service =
                  getServiceName(log);

                return (
                  <Box
                    key={`${log.timestamp}-${index}`}
                    sx={{
                      px: {
                        xs: 2,
                        md: 3,
                      },

                      py: 1.8,

                      borderBottom:
                        index ===
                        filteredLogs.length - 1
                          ? "none"
                          : "1px solid",

                      borderColor:
                        "divider",

                      backgroundColor:
                        level === "ERROR"
                          ? "rgba(211,47,47,0.045)"
                          : level === "WARNING"
                          ? "rgba(237,108,2,0.045)"
                          : "transparent",

                      transition:
                        "background-color 0.15s ease",

                      "&:hover": {
                        backgroundColor:
                          "action.hover",
                      },
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        lg: "row",
                      }}
                      spacing={2}
                      alignItems={{
                        lg: "center",
                      }}
                    >
                      {/* TIMESTAMP */}

                      <Stack
                        direction="row"
                        spacing={0.7}
                        alignItems="center"
                        sx={{
                          minWidth: {
                            lg: 180,
                          },
                        }}
                      >
                        <AccessTime
                          sx={{
                            fontSize: 15,
                            color:
                              "text.secondary",
                          }}
                        />

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {formatTimestamp(
                            log.timestamp
                          )}
                        </Typography>
                      </Stack>

                      {/* SERVICE */}

                      <Chip
                        label={service}
                        color={getServiceColor(
                          service
                        )}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 130,
                          justifyContent:
                            "center",
                        }}
                      />

                      {/* LEVEL */}

                      <Chip
                        label={level}
                        color={getLevelColor(
                          level
                        )}
                        size="small"
                        sx={{
                          minWidth: 75,
                        }}
                      />

                      {/* MESSAGE */}

                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily:
                            "monospace",
                          wordBreak:
                            "break-word",
                          flex: 1,
                          lineHeight: 1.6,
                        }}
                      >
                        {message}
                      </Typography>
                    </Stack>
                  </Box>
                );
              }
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}