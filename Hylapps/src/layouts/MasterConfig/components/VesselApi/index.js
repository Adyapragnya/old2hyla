import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress } from '@mui/material';
import VesselApiForm from './VesselApiForm';
import ApiDetailsCard from './ApiDetailsCard';
import axios from 'axios'; // For making API requests

const VesselApi = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [apiData, setApiData] = useState([]); // Store fetched API data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error handling
  const [retry, setRetry] = useState(false); // Retry mechanism
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  // Fetch API data when the component mounts or if the retry flag is set
  useEffect(() => {
    const fetchApiData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseURL}/api/vessel-api/vesselApis`); // Replace with your API endpoint
        setApiData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching API data:", error);
        setError("Failed to load API data.");
        setLoading(false);
      }
    };

    fetchApiData();
  }, [retry]); // Fetch again when the retry flag is changed

  const handleCreateApiMapping = () => {
    setIsFormVisible(true); // Open the modal form
  };

  const handleCloseForm = () => {
    setIsFormVisible(false); // Close the modal form
  };

  const handleRetry = () => {
    setRetry(prev => !prev); // Toggle the retry flag to trigger a new fetch
  };

  const renderApiCards = () => {
    if (loading) {
      return <CircularProgress size={50} sx={{ marginTop: 2 }} />;
    }

    if (error) {
      return (
        <Box sx={{ textAlign: 'center', marginTop: 2 }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button variant="contained" color="secondary" onClick={handleRetry} sx={{ marginTop: 2 }}>
            Retry
          </Button>
        </Box>
      );
    }

    if (apiData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', marginTop: 2 }}>
          <Typography variant="h6">No API data available</Typography>
        </Box>
      );
    }

    return apiData.map((api) => (
      <ApiDetailsCard
        key={api.apiName} // Unique key for each API
        apiName={api.apiName}
        apiUrl={api.apiUrl}
        apiKey={api.apiKey}  // Ensure to hide API key in the component
        status={api.status}
        isActive={api.isActive}
        onEdit={() => console.log(`Edit ${api.apiName} API`)}
      />
    ));
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 500 }}>Vessel API Details</Typography>

      {/* Render API Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {renderApiCards()}
      </Box>

      {/* Button to open the modal for creating API mapping */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateApiMapping}
        sx={{
          marginTop: 3,
          backgroundColor: '#1976d2',
          '&:hover': { backgroundColor: '#1565c0' },
        }}
      >
        Create API Mapping
      </Button>

      {/* Modal with API Form */}
      <Dialog open={isFormVisible} onClose={handleCloseForm} fullWidth maxWidth="md">
        <DialogTitle>Create API Mapping</DialogTitle>
        <DialogContent>
          <VesselApiForm />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VesselApi;
