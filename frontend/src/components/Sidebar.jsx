import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const menuItems = [
  {
    label: "Overview",
    icon: <DashboardRoundedIcon />,
  },
  {
    label: "Metrics",
    icon: <TimelineRoundedIcon />,
  },
  {
    label: "Incidents",
    icon: <WarningAmberRoundedIcon />,
  },
  {
    label: "Logs",
    icon: <StorageRoundedIcon />,
  },
  {
    label: "AI Analysis",
    icon: <AutoAwesomeRoundedIcon />,
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
}) {
  return (
    <Box
      sx={{
        width: 240,
        minHeight: "100vh",
        backgroundColor: "#0f141b",
        borderRight:
          "1px solid rgba(148, 163, 184, 0.12)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 72,
          display: "flex",
          alignItems: "center",
          px: 2.5,
        }}
      >
        <AutoAwesomeRoundedIcon
          sx={{
            color: "primary.main",
            fontSize: 28,
            mr: 1.2,
          }}
        />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            IncidentAI
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Intelligence Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ px: 1.2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={activePage === item.label}
            onClick={() => onNavigate(item.label)}
            sx={{
              mb: 0.5,
              borderRadius: 2,
              minHeight: 46,

              "&.Mui-selected": {
                backgroundColor:
                  "rgba(99, 102, 241, 0.15)",
                color: "primary.main",

                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
              },

              "&:hover": {
                backgroundColor:
                  "rgba(99, 102, 241, 0.08)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 600,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Settings */}
      <Box sx={{ px: 1.2, pb: 2 }}>
        <ListItemButton
          sx={{
            borderRadius: 2,

            "&:hover": {
              backgroundColor:
                "rgba(99, 102, 241, 0.08)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: "text.secondary",
            }}
          >
            <SettingsRoundedIcon />
          </ListItemIcon>

          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 600,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}