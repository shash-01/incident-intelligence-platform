import { useEffect, useMemo, useState } from "react";



import {

  Alert,

  Box,

  Button,

  Chip,

  CircularProgress,

  Paper,

  Stack,

  Typography,

} from "@mui/material";



import {

  AccessTime,

  AutoAwesome,

  CheckCircle,

  Error,

  Memory,

  MonitorHeart,

  Refresh,

  Speed,

  WarningAmber,

} from "@mui/icons-material";



import {

  Area,

  AreaChart,

  CartesianGrid,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";



const API_BASE_URL = "http://127.0.0.1:8003";



/* =========================================================

   HELPERS

\========================================================= */



function formatNumber(value, decimals = 2) {

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



  return `${(

    Number(bytes) /

    1024 /

    1024

  ).toFixed(1)} MB`;

}



function formatTime(timestamp) {

  if (!timestamp) {

    return "-";

  }



  try {

    return new Date(timestamp).toLocaleTimeString();

  } catch {

    return timestamp;

  }

}



function formatDateTime(timestamp) {

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



function getServiceStatus(value) {

  return Number(value) > 0;

}



/* =========================================================

   METRIC CARD

\========================================================= */



function MetricCard({

  title,

  value,

  unit,

  subtitle,

  icon,

  status = "normal",

}) {

  const statusColor =

    status === "warning"

      ? "warning.main"

      : status === "error"

      ? "error.main"

      : "primary.main";



  const background =

    status === "warning"

      ? "rgba(237,108,2,0.08)"

      : status === "error"

      ? "rgba(211,47,47,0.08)"

      : "rgba(99,102,241,0.08)";



  return (

    <Paper

      sx={{

        p: 2.5,

        flex: 1,

        minWidth: 210,

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

            variant="h4"

            fontWeight={700}

            sx={{

              mt: 0.7,

              letterSpacing: "-0.02em",

            }}

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



          {subtitle && (

            <Typography

              variant="caption"

              color="text.secondary"

              sx={{

                display: "block",

                mt: 0.5,

              }}

            >

              {subtitle}

            </Typography>

          )}

        </Box>



        <Box

          sx={{

            width: 40,

            height: 40,

            borderRadius: 2,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            color: statusColor,

            backgroundColor: background,

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

\========================================================= */



function SectionHeader({

  title,

  subtitle,

  icon,

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

   SERVICE CARD

\========================================================= */



function ServiceCard({

  name,

  healthy,

}) {

  return (

    <Paper

      sx={{

        p: 2,

        flex: 1,

        minWidth: 200,

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

            variant="subtitle1"

            fontWeight={600}

          >

            {name}

          </Typography>



          <Typography

            variant="caption"

            color="text.secondary"

          >

            Microservice

          </Typography>

        </Box>



        <Chip

          icon={

            healthy ? (

              <CheckCircle />

            ) : (

              <Error />

            )

          }

          label={

            healthy

              ? "Healthy"

              : "Down"

          }

          color={

            healthy

              ? "success"

              : "error"

          }

          size="small"

        />

      </Stack>

    </Paper>

  );

}



/* =========================================================

   DASHBOARD

\========================================================= */



export default function Dashboard() {

  const [metrics, setMetrics] = useState(null);



  const [incidents, setIncidents] =

    useState([]);



  const [latestIncident, setLatestIncident] =

    useState(null);



  const [history, setHistory] =

    useState([]);



  const [loading, setLoading] =

    useState(true);



  const [error, setError] =

    useState("");



  const fetchDashboardData =

    async (initial = false) => {

      try {

        if (initial) {

          setLoading(true);

        }



        const [

          metricsResponse,

          incidentsResponse,

          latestResponse,

        ] = await Promise.all([

          fetch(

            `${API_BASE_URL}/metrics/current`

          ),

          fetch(

            `${API_BASE_URL}/incidents/history`

          ),

          fetch(

            `${API_BASE_URL}/incidents/latest`

          ),

        ]);



        if (!metricsResponse.ok) {

          throw new Error(

            "Failed to fetch metrics"

          );

        }



        if (!incidentsResponse.ok) {

          throw new Error(

            "Failed to fetch incident history"

          );

        }



        const metricsData =

          await metricsResponse.json();



        const incidentsData =

          await incidentsResponse.json();



        let latestData = null;



        if (latestResponse.ok) {

          latestData =

            await latestResponse.json();

        }



        const currentMetrics = metricsData.metrics || {};

        setMetrics(currentMetrics);



        setIncidents(

          incidentsData.incidents || []

        );



        setLatestIncident(

          latestData

        );



        setHistory((previous) => {

          const point = {

            time: new Date(),



            cpu: Number(

              currentMetrics.cpu || 0

            ),



            memory:

              Number(

                currentMetrics.memory || 0

              ) /

              1024 /

              1024,



            requestRate: Number(

              currentMetrics.request_rate || 0

            ),



            latency: Number(

              currentMetrics.latency || 0

            ),



            errorRate: Number(

              currentMetrics.error_rate || 0

            ),

          };



          const updated = [

            ...previous,

            point,

          ];



          return updated.slice(-30);

        });



        setError("");

      } catch (err) {

        console.error(err);



        setError(

          err.message ||

            "Unable to load dashboard data."

        );

      } finally {

        setLoading(false);

      }

    };



  useEffect(() => {

    fetchDashboardData(true);



    const interval = setInterval(() => {

      fetchDashboardData(false);

    }, 5000);



    return () => {

      clearInterval(interval);

    };

  }, []);



  /* =======================================================

     DERIVED DATA

  ======================================================= */



  const healthyServices = useMemo(() => {

    if (!metrics) {

      return {

        user: false,

        order: false,

        payment: false,

      };

    }



    return {

      user: getServiceStatus(

        metrics.services

          ?.user_service ??

          metrics.user_service ??

          metrics.user

      ),



      order: getServiceStatus(

        metrics.services

          ?.order_service ??

          metrics.order_service ??

          metrics.order

      ),



      payment: getServiceStatus(

        metrics.services

          ?.payment_service ??

          metrics.payment_service ??

          metrics.payment

      ),

    };

  }, [metrics]);



  const totalHealthy =

    Object.values(

      healthyServices

    ).filter(Boolean).length;



  const systemHealthy =

    totalHealthy === 3;



  const recentIncidents =

    incidents.slice(0, 5);



  const chartData = history.map(

    (item) => ({

      time: formatTime(item.time),



      cpu: Number(

        item.cpu.toFixed(2)

      ),



      memory: Number(

        item.memory.toFixed(1)

      ),



      requestRate: Number(

        item.requestRate.toFixed(2)

      ),



      latency: Number(

        item.latency.toFixed(3)

      ),

    })

  );



  /* =======================================================

     LOADING

  ======================================================= */



  if (loading && !metrics) {

    return (

      <Box

        sx={{

          minHeight: "60vh",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          flexDirection: "column",

          gap: 2,

        }}

      >

        <CircularProgress />



        <Typography

          color="text.secondary"

        >

          Loading system overview\...

        </Typography>

      </Box>

    );

  }



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

          justifyContent:

            "space-between",

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

            System Overview

          </Typography>



          <Typography

            variant="body2"

            color="text.secondary"

            sx={{ mt: 0.5 }}

          >

            Real-time observability and

            incident intelligence for your

            microservices

          </Typography>

        </Box>



        <Stack

          direction="row"

          spacing={1}

          alignItems="center"

        >

          <Chip

            icon={

              systemHealthy ? (

                <CheckCircle />

              ) : (

                <WarningAmber />

              )

            }

            label={

              systemHealthy

                ? "All Systems Operational"

                : `${totalHealthy}/3 Services Healthy`

            }

            color={

              systemHealthy

                ? "success"

                : "warning"

            }

          />



          <Button

            variant="outlined"

            size="small"

            startIcon={<Refresh />}

            onClick={() =>

              fetchDashboardData(false)

            }

          >

            Refresh

          </Button>

        </Stack>

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

          METRIC CARDS

      =================================================== */}



      <Stack

        direction={{

          xs: "column",

          sm: "row",

        }}

        spacing={2}

        sx={{ mb: 3 }}

      >

        <MetricCard

          title="CPU Usage"

          value={formatNumber(

            metrics?.cpu

          )}

          unit="%"

          subtitle="Current system CPU"

          icon={<Speed />}

          status={

            Number(metrics?.cpu) > 10

              ? "warning"

              : "normal"

          }

        />



        <MetricCard

          title="Memory Usage"

          value={formatMemory(

            metrics?.memory

          )}

          subtitle="Resident memory"

          icon={<Memory />}

        />



        <MetricCard

          title="Request Rate"

          value={formatNumber(

            metrics?.request_rate

          )}

          unit="req/s"

          subtitle="Current traffic"

          icon={<MonitorHeart />}

        />



        <MetricCard

          title="Error Rate"

          value={formatNumber(

            metrics?.error_rate

          )}

          unit="%"

          subtitle="4xx / 5xx requests"

          icon={<Error />}

          status={

            Number(

              metrics?.error_rate

            ) > 0

              ? "error"

              : "normal"

          }

        />

      </Stack>



      {/* ===================================================

          SERVICE HEALTH

      =================================================== */}



      <Paper

        sx={{

          p: 3,

          mb: 3,

          border: "1px solid",

          borderColor: "divider",

        }}

      >

        <SectionHeader

          title="Service Health"

          subtitle="Current availability of the monitored microservices"

          icon={

            <MonitorHeart color="primary" />

          }

        />



        <Stack

          direction={{

            xs: "column",

            md: "row",

          }}

          spacing={2}

        >

          <ServiceCard

            name="user-service"

            healthy={

              healthyServices.user

            }

          />



          <ServiceCard

            name="order-service"

            healthy={

              healthyServices.order

            }

          />



          <ServiceCard

            name="payment-service"

            healthy={

              healthyServices.payment

            }

          />

        </Stack>

      </Paper>



      {/* ===================================================

          TRENDS

      =================================================== */}



      <Paper

        sx={{

          p: 3,

          mb: 3,

          border: "1px solid",

          borderColor: "divider",

        }}

      >

        <SectionHeader

          title="Live System Trends"

          subtitle="Metrics collected from Prometheus"

          icon={

            <Speed color="primary" />

          }

        />



        <Box

          sx={{

            width: "100%",

            height: 320,

          }}

        >

          {chartData.length < 2 ? (

            <Box

              sx={{

                height: "100%",

                display: "flex",

                alignItems: "center",

                justifyContent:

                  "center",

              }}

            >

              <Typography

                color="text.secondary"

              >

                Collecting metric history...

              </Typography>

            </Box>

          ) : (

            <ResponsiveContainer

              width="100%"

              height="100%"

            >

              <AreaChart

                data={chartData}

                margin={{

                  top: 10,

                  right: 10,

                  left: 0,

                  bottom: 0,

                }}

              >

                <CartesianGrid

                  strokeDasharray="3 3"

                  opacity={0.15}

                />



                <XAxis

                  dataKey="time"

                  tick={{

                    fontSize: 11,

                  }}

                />



                <YAxis

                  tick={{

                    fontSize: 11,

                  }}

                />



                <Tooltip />



                <Area

                  type="monotone"

                  dataKey="cpu"

                  name="CPU %"

                  fill="rgba(99,102,241,0.15)"

                  stroke="#6366f1"

                  strokeWidth={2}

                />



                <Area

                  type="monotone"

                  dataKey="requestRate"

                  name="Requests/s"

                  fill="rgba(46,125,50,0.08)"

                  stroke="#2e7d32"

                  strokeWidth={2}

                />



                <Area

                  type="monotone"

                  dataKey="latency"

                  name="Latency"

                  fill="rgba(237,108,2,0.08)"

                  stroke="#ed6c02"

                  strokeWidth={2}

                />

              </AreaChart>

            </ResponsiveContainer>

          )}

        </Box>

      </Paper>



      {/* ===================================================

          INCIDENT + AI STATUS

      =================================================== */}



      <Stack

        direction={{

          xs: "column",

          lg: "row",

        }}

        spacing={3}

        sx={{ mb: 3 }}

      >

        {/* RECENT INCIDENTS */}



        <Paper

          sx={{

            p: 3,

            flex: 1.4,

            border: "1px solid",

            borderColor: "divider",

          }}

        >

          <SectionHeader

            title="Recent Incidents"

            subtitle="Latest anomalies identified by the detection pipeline"

            icon={

              <WarningAmber color="warning" />

            }

          />



          {recentIncidents.length === 0 ? (

            <Box

              sx={{

                py: 4,

                textAlign: "center",

              }}

            >

              <CheckCircle

                color="success"

                sx={{

                  fontSize: 40,

                  mb: 1,

                }}

              />



              <Typography

                fontWeight={600}

              >

                No incidents detected

              </Typography>



              <Typography

                variant="body2"

                color="text.secondary"

                sx={{ mt: 0.5 }}

              >

                The system is currently

                operating normally.

              </Typography>

            </Box>

          ) : (

            <Stack spacing={1}>

              {recentIncidents.map(

                (incident, index) => (

                  <Box

                    key={

                      incident.timestamp ||

                      index

                    }

                    sx={{

                      p: 1.8,

                      borderRadius: 2,

                      border: "1px solid",

                      borderColor:

                        "divider",

                      "&:hover": {

                        backgroundColor:

                          "action.hover",

                      },

                    }}

                  >

                    <Stack

                      direction={{

                        xs: "column",

                        sm: "row",

                      }}

                      justifyContent="space-between"

                      spacing={1}

                    >

                      <Box>

                        <Stack

                          direction="row"

                          spacing={1}

                          alignItems="center"

                        >

                          <Chip

                            label={

                              incident.service

                            }

                            size="small"

                            color="primary"

                            variant="outlined"

                          />



                          <Chip

                            label="Anomaly"

                            size="small"

                            color="error"

                          />

                        </Stack>



                        <Typography

                          variant="body2"

                          fontWeight={600}

                          sx={{

                            mt: 1,

                          }}

                        >

                          CPU:{" "}

                          {formatNumber(

                            incident.cpu

                          )}

                          %

                        </Typography>

                      </Box>



                      <Box

                        sx={{

                          textAlign: {

                            sm: "right",

                          },

                        }}

                      >

                        <Typography

                          variant="caption"

                          color="text.secondary"

                        >

                          Severity

                        </Typography>



                        <Typography

                          variant="body1"

                          fontWeight={700}

                        >

                          {formatNumber(

                            incident

                              .incident_severity

                          )}

                        </Typography>



                        <Typography

                          variant="caption"

                          color="text.secondary"

                        >

                          {formatDateTime(

                            incident.timestamp

                          )}

                        </Typography>

                      </Box>

                    </Stack>

                  </Box>

                )

              )}

            </Stack>

          )}

        </Paper>



        {/* AI STATUS */}



        <Paper

          sx={{

            p: 3,

            flex: 1,

            border: "1px solid",

            borderColor: "divider",

          }}

        >

          <SectionHeader

            title="AI Intelligence"

            subtitle="Current incident-analysis capabilities"

            icon={

              <AutoAwesome color="primary" />

            }

          />



          <Stack spacing={1.5}>

            {[

              [

                "Isolation Forest",

                "Anomaly Detection",

                "success",

              ],

              [

                "SHAP",

                "Explainable AI",

                "success",

              ],

              [

                "Loki",

                "Log Correlation",

                "success",

              ],

              [

                "ChromaDB",

                "Knowledge Retrieval",

                "success",

              ],

              [

                "Groq LLM",

                "AI Recommendation",

                "success",

              ],

            ].map(

              (item) => (

                <Box

                  key={item[0]}

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

                  <Stack

                    direction="row"

                    justifyContent="space-between"

                    alignItems="center"

                  >

                    <Box>

                      <Typography

                        variant="body2"

                        fontWeight={600}

                      >

                        {item[0]}

                      </Typography>



                      <Typography

                        variant="caption"

                        color="text.secondary"

                      >

                        {item[1]}

                      </Typography>

                    </Box>



                    <Chip

                      label="Active"

                      size="small"

                      color={item[2]}

                    />

                  </Stack>

                </Box>

              )

            )}

          </Stack>

        </Paper>

      </Stack>



      {/* ===================================================

          LATEST INCIDENT

      =================================================== */}



      {latestIncident && (

        <Paper

          sx={{

            p: 3,

            border: "1px solid",

            borderColor:

              "warning.main",

            backgroundColor:

              "rgba(237,108,2,0.04)",

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

                  Latest Incident

                </Typography>



                <Chip

                  label="ANOMALY"

                  color="error"

                  size="small"

                />

              </Stack>



              <Typography

                variant="body1"

                fontWeight={600}

                sx={{ mt: 1 }}

              >

                {latestIncident.service ||

                  latestIncident.incident

                    ?.service ||

                  "Unknown service"}

              </Typography>



              <Typography

                variant="body2"

                color="text.secondary"

                sx={{ mt: 0.5 }}

              >

                {latestIncident

                  .root_cause ||

                  latestIncident.incident

                    ?.root_cause ||

                  "Incident detected by anomaly detection pipeline"}

              </Typography>

            </Box>



            <Stack

              direction="row"

              spacing={1}

            >

              <Chip

                label={`Severity ${formatNumber(

                  latestIncident

                    .incident_severity ||

                    latestIncident.incident

                      ?.incident_severity

                )}`}

                color="warning"

              />



              <Button

                variant="contained"

                startIcon={

                  <AutoAwesome />

                }

                onClick={() => {

                  window.dispatchEvent(

                    new CustomEvent(

                      "navigate-to-ai-analysis"

                    )

                  );

                }}

              >

                View AI Analysis

              </Button>

            </Stack>

          </Stack>

        </Paper>

      )}



      {/* ===================================================

          FOOTER

      =================================================== */}



      <Stack

        direction="row"

        spacing={1}

        alignItems="center"

        sx={{ mt: 2 }}

      >

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

          Dashboard automatically refreshes

          every 5 seconds

        </Typography>

      </Stack>

    </Box>

  );

}