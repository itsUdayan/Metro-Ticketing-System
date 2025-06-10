import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import axios from "axios";

const UpdateFareModal = ({ open, onClose }) => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [fare, setFare] = useState("");

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:3000/api/admin/fare", {
        sourceStation: source,
        destinationStation: destination,
        fare: parseFloat(fare),
      });
      onClose(true);
    } catch (error) {
      alert("Error updating fare: " + error.response?.data?.message);
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>Set Fare</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Source Station Code"
          margin="normal"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <TextField
          fullWidth
          label="Destination Station Code"
          margin="normal"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <TextField
          fullWidth
          type="number"
          label="Fare"
          margin="normal"
          value={fare}
          onChange={(e) => setFare(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save Fare</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateFareModal;
