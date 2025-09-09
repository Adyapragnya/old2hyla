import express from 'express';
import AisSatPull from '../models/AisSatPull.js';

const router = express.Router();


// GET /api/sat-intervals?roleType=organization
router.get('/get-sat-intervals-basedon-role', async (req, res) => {
  try {
    const filter = {};
    if (req.query.roleType) {
      filter.roleType = req.query.roleType;
    }
    const intervals = await AisSatPull.find(filter);
    res.json(intervals);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching SAT intervals' });
  }
});



router.post('/update-sat-intervals', async (req, res) => {
  try {
    const updatedSatValues = req.body.updatedSatValues; // array of { orgId?, roleType?, sat0, sat1a, sat1b }

    for (const satValue of updatedSatValues) {
      // Decide filter key: prefer orgId if present, otherwise use roleType
      const filter = satValue.orgId
        ? { orgId: satValue.orgId }
        : { roleType: satValue.roleType };

      await AisSatPull.updateOne(
        filter,
        {
          $set: {
            sat0:  satValue.sat0,
            sat1a: satValue.sat1a,
            sat1b: satValue.sat1b,
          }
        }
      );
    }

    res.status(200).json({ message: 'SAT intervals updated successfully' });
  } catch (error) {
    console.error('Error updating SAT intervals:', error);
    res.status(500).json({ message: 'Failed to update SAT intervals', error });
  }
});


export default router;
