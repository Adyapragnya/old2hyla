// routes/vesselApiRoutes.js
import express from 'express';
import TrackedVessel from '../models/TrackedVessel.js';
import VesselApiMapping from '../models/VesselApiMapping.js';
import {
  getRandomTrackedVesselIMO,
  fetchVesselData,
  suggestMapping
} from '../services/mappingService.js';

const router = express.Router();

// POST /api/vessel-api/suggest-mapping
router.post('/suggest-mapping', async (req, res) => {
  try {
    const { apiName, apiUrl, apiKey, apiType = 'vtexplorer' } = req.body;

    const imo = await getRandomTrackedVesselIMO();
    if (!imo) return res.status(400).json({ error: 'No vessel IMOs found in DB' });

    const rawData = await fetchVesselData(apiUrl, apiKey, imo, apiType);


    if (!rawData || typeof rawData !== 'object') {
      return res.status(400).json({ error: 'Invalid or empty API response' });
    }

    const sample = rawData;
    const aisFields = Object.keys(TrackedVessel.schema.obj.AIS);

    const { mapping, unmatchedApiFields, newFields } = suggestMapping(sample, aisFields);
   
    res.json({ imo, sample, mapping, unmatchedApiFields, newFields });
  } catch (error) {
    console.error('Suggest mapping error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vessel-api/save-mapping
router.post('/save-mapping', async (req, res) => {
  try {
    const { apiName, apiUrl, apiKey, mapping, newFields, imo } = req.body;

    if (!apiName || !apiUrl || !apiKey || !mapping || !imo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Incoming body:', req.body);

    // Convert mapping object to Map explicitly
  // Clean empty string values in mapping and convert to Map
const sanitizedMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
  acc[key] = value === '' ? null : value;
  return acc;
}, {});
const mappingMap = new Map(Object.entries(sanitizedMapping));

    console.log('Converted mapping to Map:', mappingMap);

    // await VesselApiMapping.findOneAndDelete({ apiName });

    const newDoc = new VesselApiMapping({
      apiName,
      apiUrl,
      apiKey,
      mapping: mappingMap,
      newFields,
      sampleImo: imo,
    });

    const savedDoc = await newDoc.save();
    console.log('Saved document:', savedDoc);

    res.json({ success: true });
  } catch (error) {
    console.error('Save mapping error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// routes/vesselApi.js
router.get('/current', async (req, res) => {
  try {
    const current = await VesselApiMapping.findOne({ apiName: 'vtexplorer' }); // or whatever apiName you want
    if (!current) return res.status(404).json({ message: 'No mapping found' });

    // Optionally fetch a sample using the stored IMO (you may already be doing this elsewhere)
    // const sample = await fetchAISFromApi(current.apiUrl, current.apiKey, current.sampleImo);

    res.json({
      apiName: current.apiName,
      apiUrl: current.apiUrl,
      apiKey: current.apiKey,
    
    });
  } catch (error) {
    console.error('Error fetching current mapping:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/vesselApis', async (req, res) => {
  try {
    const vesselApis = await VesselApiMapping.find();
    res.json(vesselApis);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vessel APIs' });
  }
});

export default router;
