// routes/vesselApiRoutes.js
import express from 'express';
import VesselDeletionDays from '../models/VesselDeletionDays.js';


const router = express.Router();

router.get('/get-vessel-deletion-days', async (req, res) => {
  try {
    const settings = await VesselDeletionDays.findOne();
    if (!settings) {
      return res.json({ reminderDay: 30, deleteDay: 31 });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.post('/update-vessel-deletion-days', async (req, res) => {
  const { reminderDay, deleteDay } = req.body;

  if (deleteDay <= reminderDay) {
    return res.status(400).json({ error: "Delete day must be greater than reminder day" });
  }

  try {
    const updated = await VesselDeletionDays.findOneAndUpdate(
      {},
      { reminderDay, deleteDay },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});


export default router;