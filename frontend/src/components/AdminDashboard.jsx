import React, { useState } from "react";
import AddStationModal from "./AddStationModal";
import UpdateFareModal from "./UpdateFareModal";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import FingerprintEnrollmentModal from "./enroll/FingerprintEnrollmentModal";
import {
  PersonAdd as PersonAddIcon,
  Place as PlaceIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";

const AdminDashboard = () => {
  const theme = useTheme();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [fareModalOpen, setFareModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const featureCards = [
    {
      icon: <PersonAddIcon sx={{ fontSize: 48 }} />,
      title: "Register User",
      description: "Add new users to the system",
      color: theme.palette.primary.main,
      action: "Go to Register",
    },
    {
      icon: <PlaceIcon sx={{ fontSize: 48 }} />,
      title: "Add Station",
      description: "Add new stations to the metro network",
      color: theme.palette.secondary.main,
      action: "Add Station",
    },
    {
      icon: <AttachMoneyIcon sx={{ fontSize: 48 }} />,
      title: "Change Fare",
      description: "Update fare prices for routes",
      color: theme.palette.success.main,
      action: "Update Fares",
    },
  ];

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 4,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.light,
          0.1
        )} 0%, ${alpha(theme.palette.background.default, 0.3)} 100%)`,
      }}
    >
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 4,
          color: theme.palette.text.primary,
          textShadow: `0 2px 4px ${alpha(theme.palette.text.primary, 0.1)}`,
        }}
      >
        Admin Dashboard
      </Typography>

      <Grid container spacing={4}>
        {featureCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                minHeight: 280,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: `0 8px 16px ${alpha(card.color, 0.2)}`,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 24px ${alpha(card.color, 0.3)}`,
                },
                background: `linear-gradient(145deg, ${alpha(
                  card.color,
                  0.05
                )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                border: `1px solid ${alpha(card.color, 0.2)}`,
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    background: `linear-gradient(45deg, ${alpha(
                      card.color,
                      0.1
                    )} 0%, ${alpha(card.color, 0.3)} 100%)`,
                    boxShadow: `0 4px 8px ${alpha(card.color, 0.2)}`,
                  }}
                >
                  {React.cloneElement(card.icon, {
                    sx: {
                      color: card.color,
                      fontSize: 40,
                    },
                  })}
                </Box>

                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: theme.palette.text.primary,
                  }}
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3,
                  }}
                >
                  {card.description}
                </Typography>
              </CardContent>

              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "center",
                  background: alpha(card.color, 0.05),
                  borderTop: `1px solid ${alpha(card.color, 0.1)}`,
                }}
              >
                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      background: alpha(card.color, 0.1),
                    },
                  }}
                  onClick={() => {
                    if (card.action === "Go to Register")
                      setEnrollModalOpen(true);
                    else if (card.action === "Add Station")
                      setStationModalOpen(true);
                    else if (card.action === "Update Fares")
                      setFareModalOpen(true);
                  }}
                >
                  {card.action}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      <FingerprintEnrollmentModal
        open={enrollModalOpen}
        onClose={(success) => {
          setEnrollModalOpen(false);
          if (success) {
            // Optionally show success message or refresh data
            showSnackbar("User registered successfully");
          }
        }}
        deviceId="METRO_DEVICE_001" // Replace with your actual device ID
      />
      <AddStationModal
        open={stationModalOpen}
        onClose={(success) => {
          setStationModalOpen(false);
          if (success) showSnackbar("Station added successfully");
        }}
      />
      <UpdateFareModal
        open={fareModalOpen}
        onClose={(success) => {
          setFareModalOpen(false);
          if (success) showSnackbar("Fare rule saved successfully");
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
