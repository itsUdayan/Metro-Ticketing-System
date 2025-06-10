import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const UserRegistrationForm = ({ fingerprintId, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3000/api/admin/user', {
        fingerprintId,
        ...formData
      });
      
      onComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle1" gutterBottom>
        Fingerprint ID: {fingerprintId}
      </Typography>
      
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Initial Balance"
            name="balance"
            type="number"
            value={formData.balance}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
            variant="outlined"
          />
        </Grid>
      </Grid>
      
      {error && (
        <Typography color="error" mt={2}>
          {error}
        </Typography>
      )}
      
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button
          onClick={onCancel}
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
        </Button>
      </Box>
    </Box>
  );
};

export default UserRegistrationForm;