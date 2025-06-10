import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import TripHistoryModal from "./TripHistoryModel";
import {
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  Directions as DirectionsIcon,
  Close as CloseIcon,
  Fingerprint as FingerprintIcon,
} from "@mui/icons-material";
import axios from "axios";

const UserDashboard = () => {
  const theme = useTheme();
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripStep, setTripStep] = useState("start"); // 'start' or 'destination'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [activeTrip, setActiveTrip] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [fingerprintIdInput, setFingerprintIdInput] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceSuccess, setBalanceSuccess] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Fetch stations on component mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/stations");
        setStations(response.data.stations);
      } catch (err) {
        console.error("Error fetching stations:", err);
      }
    };
    fetchStations();
  }, []);

  const startNewTrip = async () => {
    setTripModalOpen(true);
    setTripStep("start");
    setStatusMessage("Preparing trip initialization...");
  };

  const handleStartTrip = async () => {
    setLoading(true);
    setError(null);

    try {
      // Send SOURCE command to backend
      const response = await axios.post(
        "http://localhost:3000/api/trip/start",
        {
          deviceId: "METRO_DEVICE_001",
        }
      );

      setStatusMessage("Waiting for fingerprint verification...");

      // Poll for verification status
      const interval = setInterval(async () => {
        try {
          const verifyResponse = await axios.get(
            "http://localhost:3000/api/trip/active"
          );
          if (verifyResponse.data && verifyResponse.data.status === "STARTED") {
            clearInterval(interval);
            setActiveTrip(verifyResponse.data);
            setTripStep("destination");
            setLoading(false);
            setStatusMessage("Please select destination station");
          }
        } catch (err) {
          console.log("Waiting for verification...");
        }
      }, 3000);

      return () => clearInterval(interval);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start trip");
      setLoading(false);
    }
  };

  const handleSetDestination = async () => {
    if (!selectedStation) {
      setError("Please select a destination station");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set destination station
      await axios.post("http://localhost:3000/api/trip/setDestination", {
        tripId: activeTrip._id,
        destinationStation: selectedStation,
        deviceId: "METRO_DEVICE_001",
      });

      setStatusMessage("Waiting for destination verification...");

      // Poll for trip completion
      const interval = setInterval(async () => {
        try {
          const tripResponse = await axios.get(
            `http://localhost:3000/api/trip/${activeTrip._id}`
          );
          if (tripResponse.data && tripResponse.data.status === "COMPLETED") {
            clearInterval(interval);
            setLoading(false);
            setVerificationComplete(true);
            setStatusMessage("Trip completed successfully!");

            // Close modal after 3 seconds
            setTimeout(() => {
              setTripModalOpen(false);
              setVerificationComplete(false);
              setActiveTrip(null);
              setSelectedStation("");
            }, 3000);
          }
        } catch (err) {
          console.log("Waiting for destination verification...");
        }
      }, 3000);

      return () => clearInterval(interval);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set destination");
      setLoading(false);
    }
  };

  const handleCloseTripModal = () => {
    setTripModalOpen(false);
    setTripStep("start");
    setActiveTrip(null);
    setSelectedStation("");
    setError(null);
    setLoading(false);
    setVerificationComplete(false);
  };

  const handleAddBalanceClick = () => {
    setFingerprintIdInput("");
    setBalanceAmount("");
    setBalanceModalOpen(true);
    setBalanceError("");
    setBalanceSuccess("");
  };

  const submitBalance = async () => {
    setBalanceLoading(true);
    setBalanceError("");
    setBalanceSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/user/add-balance",
        {
          fingerprintId: fingerprintIdInput,
          balance: parseFloat(balanceAmount),
        }
      );

      if (res.data.success) {
        setBalanceSuccess(
          `Balance added! New Balance: ₹${res.data.newBalance}`
        );
        setTimeout(() => {
          setBalanceModalOpen(false);
        }, 2500);
      } else {
        setBalanceError("Failed to add balance.");
      }
    } catch (err) {
      setBalanceError(err.response?.data?.message || "Error occurred");
    }

    setBalanceLoading(false);
  };

  const featureCards = [
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 48 }} />,
      title: "Add Balance",
      description: "Add money to your metro card",
      color: theme.palette.info.main,
      action: "Add Funds",
      onClick: handleAddBalanceClick,
    },
    {
      icon: <HistoryIcon sx={{ fontSize: 48 }} />,
      title: "Trip History",
      description: "View your past trips and expenses",
      color: theme.palette.warning.main,
      action: "View History",
      onClick: () => setHistoryModalOpen(true),
    },
    {
      icon: <DirectionsIcon sx={{ fontSize: 48 }} />,
      title: "Start Trip",
      description: "Begin a new metro journey",
      color: theme.palette.success.main,
      action: "Start Trip",
      onClick: startNewTrip,
    },
  ];

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 4,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.secondary.light,
          0.05
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
        Welcome Back
        <Typography
          component="span"
          sx={{
            display: "block",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: theme.palette.text.secondary,
            mt: 1,
          }}
        >
          Manage your metro card and trips
        </Typography>
      </Typography>

      <Grid container spacing={4}>
        {featureCards.map((card, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card
              sx={{
                minHeight: 320,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: `0 8px 16px ${alpha(card.color, 0.15)}`,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 24px ${alpha(card.color, 0.25)}`,
                },
                background: `linear-gradient(145deg, ${alpha(
                  theme.palette.background.paper,
                  0.9
                )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: `linear-gradient(90deg, ${card.color} 0%, ${alpha(
                    card.color,
                    0.7
                  )} 100%)`,
                },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  p: 4,
                  pt: 5,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    background: alpha(card.color, 0.1),
                    color: card.color,
                  }}
                >
                  {React.cloneElement(card.icon, {
                    sx: {
                      fontSize: 32,
                    },
                  })}
                </Box>

                <Typography
                  variant="h4"
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
                    fontSize: "1.1rem",
                    lineHeight: 1.6,
                  }}
                >
                  {card.description}
                </Typography>
              </CardContent>

              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    background: card.color,
                    "&:hover": {
                      background: `${card.color} !important`,
                      boxShadow: `0 4px 12px ${alpha(card.color, 0.3)}`,
                    },
                  }}
                  onClick={card.onClick}
                >
                  {card.action}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trip Management Modal */}
      <Dialog
        open={tripModalOpen}
        onClose={handleCloseTripModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {tripStep === "start" ? "Start New Trip" : "Set Destination"}
            </Typography>
            <IconButton onClick={handleCloseTripModal} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {verificationComplete ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="success.main">
                {statusMessage}
              </Typography>
              {activeTrip && (
                <Typography variant="body1" mt={2}>
                  Fare: ₹{activeTrip.fare || 20}
                </Typography>
              )}
            </Box>
          ) : tripStep === "start" ? (
            <Box textAlign="center" py={4}>
              <FingerprintIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Start Your Trip
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Verify your fingerprint to begin your metro journey
              </Typography>

              {loading ? (
                <Box mt={3}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2">{statusMessage}</Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartTrip}
                  sx={{ mt: 3 }}
                >
                  Verify Fingerprint
                </Button>
              )}

              {error && (
                <Typography color="error" mt={2}>
                  {error}
                </Typography>
              )}
            </Box>
          ) : (
            <Box py={2}>
              <Typography variant="h6" gutterBottom>
                Select Destination Station
              </Typography>

              <TextField
                select
                fullWidth
                label="Destination Station"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                {Array.isArray(stations) &&
                  stations.map((station) => (
                    <MenuItem key={station._id} value={station.name}>
                      {station.name}
                    </MenuItem>
                  ))}
              </TextField>

              {loading ? (
                <Box mt={3} display="flex" alignItems="center">
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography>{statusMessage}</Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSetDestination}
                  sx={{ mt: 3 }}
                  disabled={!selectedStation}
                >
                  Verify Destination
                </Button>
              )}

              {error && (
                <Typography color="error" mt={2}>
                  {error}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add Balance</Typography>
            <IconButton
              onClick={() => setBalanceModalOpen(false)}
              disabled={balanceLoading}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            fullWidth
            label="Fingerprint ID"
            value={fingerprintIdInput}
            onChange={(e) => setFingerprintIdInput(e.target.value)}
            type="number"
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Amount (₹)"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            type="number"
            sx={{ mt: 2 }}
          />
          {balanceError && (
            <Typography color="error" mt={2}>
              {balanceError}
            </Typography>
          )}
          {balanceSuccess && (
            <Typography color="success.main" mt={2}>
              {balanceSuccess}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={submitBalance}
            sx={{ mt: 3 }}
            disabled={balanceLoading || !fingerprintIdInput || !balanceAmount}
          >
            {balanceLoading ? <CircularProgress size={24} /> : "Add Balance"}
          </Button>
        </DialogContent>
      </Dialog>
      <TripHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </Box>
  );
};

export default UserDashboard;
