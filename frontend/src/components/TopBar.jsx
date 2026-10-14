import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

export default function TopBar() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#0b0f14",
        borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "72px !important",
          px: { xs: 2, md: 3 },
        }}
      >
        {/* Page title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.3px",
            }}
          >
            Incident Overview
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Monitor your microservice environment
          </Typography>
        </Box>

        {/* Search */}
        <IconButton
          sx={{
            color: "text.secondary",
            mr: 1,
            "&:hover": {
              color: "text.primary",
              backgroundColor: "rgba(148, 163, 184, 0.08)",
            },
          }}
        >
          <SearchRoundedIcon />
        </IconButton>

        {/* Notifications */}
        <IconButton
          sx={{
            color: "text.secondary",
            mr: 2,
            "&:hover": {
              color: "text.primary",
              backgroundColor: "rgba(148, 163, 184, 0.08)",
            },
          }}
        >
          <NotificationsNoneRoundedIcon />
        </IconButton>

        {/* User */}
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: "primary.main",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          S
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}