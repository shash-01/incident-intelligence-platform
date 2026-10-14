import { useState } from "react";

import { Box } from "@mui/material";

import Metrics from "./pages/Metrics";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Logs from "./pages/Logs";
import AIAnalysis from "./pages/AIAnalysis";

function App() {
  const [activePage, setActivePage] = useState("Overview");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "background.default",
      }}
    >
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar />

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {activePage === "Overview" && <Dashboard />}

          {activePage === "Metrics" && <Metrics />}

          {activePage === "Incidents" && <Incidents />}

          {activePage === "Logs" && <Logs />}

          {activePage === "AI Analysis" && <AIAnalysis />}
        </Box>
      </Box>
    </Box>
  );
}

export default App;