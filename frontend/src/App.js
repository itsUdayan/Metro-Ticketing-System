import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/admin-dashboard" element={
              <AdminDashboard />
          } />
          <Route path="/user-dashboard" element={
              <UserDashboard />
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;