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

const AddStationModal = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:3000/api/admin/station", { name, code });
      onClose(true);
    } catch (error) {
      alert("Error adding station: " + error.response?.data?.message);
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>Add New Station</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Station Name"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          fullWidth
          label="Station Code"
          margin="normal"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Add Station</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStationModal;
