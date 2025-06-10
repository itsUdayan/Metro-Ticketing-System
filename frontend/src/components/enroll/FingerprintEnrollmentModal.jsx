import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Fingerprint as FingerprintIcon } from '@mui/icons-material';
import UserRegistrationForm from './UserRegistrationForm';
import axios from 'axios';

const FingerprintEnrollmentModal = ({ open, onClose, deviceId }) => {
  const [step, setStep] = useState('enroll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fingerprintId, setFingerprintId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Starting enrollment process...');
  const pollingIntervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (open) {
      startEnrollmentProcess();
    } else {
      resetState();
    }
  }, [open]);

  const resetState = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setStep('enroll');
    setFingerprintId(null);
    setError(null);
    setLoading(false);
    setStatusMessage('Starting enrollment process...');
  };

  const startEnrollmentProcess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Send enroll command to backend
      setStatusMessage('Sending enrollment command...');
      await axios.post('http://localhost:3000/api/admin/enroll', { deviceId });
      setStatusMessage('Waiting for fingerprint scan...');
      
      // 2. Start polling for enrolled fingerprint
      pollingIntervalRef.current = setInterval(checkForEnrolledFingerprint, 10000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start enrollment');
      setLoading(false);
    }
  };

  const checkForEnrolledFingerprint = async () => {
    try {
      // Check for the most recent temporary user
      const response = await axios.get('http://localhost:3000/api/users/latest-temp');
      
      if (response.data && response.data.fingerprintId) {
        // Found enrolled fingerprint
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setFingerprintId(response.data.fingerprintId);
        setStep('register');
        setLoading(false);
      }
    } catch (err) {
      // Don't treat this as an error - just continue polling
      console.log('Polling for fingerprint...');
    }
  };

  const handleRegistrationComplete = () => {
    onClose(true);
  };

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {step === 'enroll' ? 'Fingerprint Enrollment' : 'User Registration'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {step === 'enroll' ? (
          <Box textAlign="center" py={4}>
            <FingerprintIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {statusMessage}
            </Typography>
            
            {loading && (
              <Box mt={3}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2">
                  {statusMessage}
                </Typography>
              </Box>
            )}
            
            {error && (
              <Typography color="error" mt={2}>
                {error}
              </Typography>
            )}
          </Box>
        ) : (
          <UserRegistrationForm 
            fingerprintId={fingerprintId} 
            onComplete={handleRegistrationComplete}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
      
      {step === 'enroll' && (
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FingerprintEnrollmentModal;