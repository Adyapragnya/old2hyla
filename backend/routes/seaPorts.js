import express from 'express';
import Seaport from '../models/Seaport.js';
import Port from '../models/Port.js';

const router = express.Router();

// Flexible search route
router.get('/search', async (req, res) => {
  const { q } = req.query;
  console.log(q);

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query too short' });
  }

  const sanitizedQuery = q.trim();
  const regex = new RegExp(sanitizedQuery, 'i');

  try {
    const results = await Seaport.find({
      $or: [
        { PORT_NAME: regex },
        { LOCODE: regex }
      ]
    })
    .sort({ PORT_NAME: 1 })
    .limit(20)
    .lean();
  console.log(results);

    return res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// 2. Add port to official collection if LOCODE is missing
router.post('/add', async (req, res) => {
  const { id, UNLOCODE } = req.body;
  if (!id || !UNLOCODE) return res.status(400).json({ error: 'Missing fields' });

  const sp = await Seaport.findById(id).lean();
  if (!sp) return res.status(404).json({ error: 'Seaport not found' });

  const existing = await Port.findOne({ UNLOCODE }).lean();
  if (existing) return res.status(409).json({ error: 'UNLOCODE already exists' });

  const port = new Port({
    name: sp.PORT_NAME,
    lat: sp.LATITUDE,
    long: sp.LONGITUDE,
    COUNTRY: sp.COUNTRY,
    UNLOCODE,
    isActive: true
  });
  await port.save();

  return res.json(port);
});

export default router;
