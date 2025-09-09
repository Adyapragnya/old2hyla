import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { Edit } from '@mui/icons-material';
import PropTypes from 'prop-types';

const ApiDetailsCard = ({ apiName, apiUrl, apiKey, status, isActive, onEdit }) => {
  return (
    <Card 
      sx={{ 
        minWidth: 275, 
        margin: 2, 
        borderRadius: 3, 
        background: '#f5f5f5', 
        border: '1px solid #e0e0e0',
        boxShadow: isActive ? 3 : 1,  // Adding box shadow for active API card to differentiate
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {apiName}
          </Typography>
          <IconButton onClick={onEdit} title="Edit API">
            <Edit color="primary" />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          <strong>API URL:</strong> {apiUrl}
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          <strong>API Key:</strong> ************ {/* Hidden API Key */}
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          <strong>Status:</strong> {status}
        </Typography>
        {/* Add color differentiation for active API */}
        <Typography variant="body2" color={isActive ? "green" : "text.secondary"}>
          <strong>{isActive ? "Active" : "Inactive"}</strong>
        </Typography>
      </CardContent>
    </Card>
  );
};

ApiDetailsCard.propTypes = {
  apiName: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired,
  apiKey: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ApiDetailsCard;
