import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import axios from "axios";

const VesselTrackingSettings = () => {
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const [reminderDay, setReminderDay] = useState(0);
  const [deleteDay, setDeleteDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/vessel-delete-days/get-vessel-deletion-days`);
        setReminderDay(res.data.reminderDay || 0);
        setDeleteDay(res.data.deleteDay || 0);
      } catch (err) {
        setMessage({ text: "Failed to load settings.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [baseURL]);

  const handleSave = async () => {
    setMessage({ text: "", type: "" });

    if (reminderDay <= 0 || deleteDay <= 0) {
      setMessage({ text: "Days must be greater than 0.", type: "error" });
      return;
    }

    if (deleteDay <= reminderDay) {
      setMessage({ text: "Delete day must be greater than reminder day.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${baseURL}/api/vessel-delete-days/update-vessel-deletion-days`, {
        reminderDay,
        deleteDay,
      });
      setMessage({ text: "Settings updated successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to update settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={3} px={2}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          width: "100%",
          maxWidth: 500,
          backgroundColor: "#fff",
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Vessel Deletion Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Update the expiry and reminder days for vessel tracking.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <TextField
            label="Reminder Day"
            type="number"
            fullWidth
            value={reminderDay}
            onChange={(e) => setReminderDay(Number(e.target.value))}
            InputProps={{ inputProps: { min: 1 } }}
            variant="outlined"
          />
          <TextField
            label="Delete Day"
            type="number"
            fullWidth
            value={deleteDay}
            onChange={(e) => setDeleteDay(Number(e.target.value))}
            InputProps={{ inputProps: { min: 1 } }}
            variant="outlined"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            fullWidth
            sx={{ textTransform: "none", fontWeight: 600, py: 1.2 }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>

          {message.text && (
            <Alert severity={message.type} sx={{ mt: 1 }}>
              {message.text}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default VesselTrackingSettings;
