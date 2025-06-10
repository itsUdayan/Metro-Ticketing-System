import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Close as CloseIcon, Fingerprint as FingerprintIcon } from '@mui/icons-material';
import axios from 'axios';

const TripHistoryModal = ({ open, onClose }) => {
  const [fingerprintId, setFingerprintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trips, setTrips] = useState([]);

  const fetchTripHistory = async () => {
    if (!fingerprintId) {
      setError('Please enter fingerprint ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`http://localhost:3000/api/trips?fingerprintId=${fingerprintId}`);
      setTrips(response.data.trips);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trip history');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFingerprintId('');
    setTrips([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Trip History</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box mb={3}>
          <TextField
            fullWidth
            label="Enter Fingerprint ID"
            value={fingerprintId}
            onChange={(e) => setFingerprintId(e.target.value)}
            type="number"
            InputProps={{
              startAdornment: (
                <FingerprintIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchTripHistory}
            disabled={loading || !fingerprintId}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'View History'}
          </Button>
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </Box>

        {trips.length > 0 && (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Fare (₹)</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip._id}>
                    <TableCell>
                      {new Date(trip.sourceTimestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{trip.sourceStation}</TableCell>
                    <TableCell>
                      {trip.destinationStation || 'Not set'}
                    </TableCell>
                    <TableCell>{trip.fare || '-'}</TableCell>
                    <TableCell>
                      <Typography 
                        color={
                          trip.status === 'COMPLETED' ? 'success.main' : 
                          trip.status === 'CANCELLED' ? 'error.main' : 'info.main'
                        }
                      >
                        {trip.status}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {trips.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              {fingerprintId ? 'No trips found for this fingerprint ID' : 'Enter fingerprint ID to view trip history'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripHistoryModal;