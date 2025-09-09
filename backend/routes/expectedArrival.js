import express from 'express';
import axios from 'axios';
import ExpectedArrival from '../models/ExpectedArrival.js';
import EmailOptionsTosend from '../models/EmailOptionsTosend.js';
import ExpectedArrivalIsmData from '../models/ExpectedArrivalIsmData.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const arrivals = await ExpectedArrival.aggregate([
      {
        $lookup: {
          from: "expectedArrivalIsmData", // collection name
          let: { imoVal: "$IMO", mmsiVal: "$AIS.MMSI" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$IMO", "$$imoVal"] },
                    { $eq: ["$MMSI", "$$mmsiVal"] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "ismData"
        }
      },
      {
        $unwind: {
          path: "$ismData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          imo: "$IMO",
          mmsi: "$AIS.MMSI",
          name: "$AIS.NAME",
          aisLocode: "$AIS.LOCODE",
          userLocode: "$LOCODE",
          timestamp: "$AIS.TIMESTAMP",
          lat: "$AIS.LATITUDE",
          lng: "$AIS.LONGITUDE",
          course: "$AIS.COURSE",
          speed: "$AIS.SPEED",
          heading: "$AIS.HEADING",
          navstat: "$AIS.NAVSTAT",
          destination: "$AIS.DESTINATION",
          eta: "$AIS.ETA",
          eta_predicted: "$AIS.ETA_PREDICTED",
          zone: "$AIS.ZONE",
          ISM_Manager: "$ismData.ISM_Manager",
          ISM_Manager_Number: "$ismData.ISM_Manager_Number",
          Commercial_Manager: "$ismData.Commercial_Manager",
          Commercial_Manager_Telephone: "$ismData.Commercial_Manager_Telephone",
          Ship_Contact: "$ismData.Ship_Contact",
          Email: "$ismData.Email"
        }
      },
      { $sort: { eta: 1 } } // Optional: sort by ETA
    ]);

    res.status(200).json(arrivals);
  } catch (error) {
    console.error('Error fetching expected arrivals:', error.message);
    res.status(500).json({ error: 'Failed to fetch expected arrivals' });
  }
});



router.post('/fetch-and-save', async (req, res) => {
  const { locode, fromDate, toDate } = req.body;

  console.log(locode);
  console.log(fromDate);
  console.log(toDate);


  if (!locode || !fromDate || !toDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const emailOptions = await EmailOptionsTosend.findOne({});

    if (!emailOptions?.aisuserkey) {
      return res.status(500).json({ error: 'AIS user key not found in EmailOptionsTosend' });
    }

    console.log('aaa',emailOptions.aisuserkey);
    const url = `https://api.vtexplorer.com/expectedarrivals?userkey=${emailOptions.aisuserkey}&locode=${locode}&fromdate=${fromDate}&todate=${toDate}`;
    const response = await axios.get(url);
    const arrivals = response.data;

    console.log(response.data);
  



    if (!Array.isArray(arrivals)) {
      return res.status(500).json({ error: 'Unexpected response format from VT Explorer' });
    }

    // Prepare documents to insert
    const documents = arrivals
      .map(entry => {
        const ais = entry.AIS;
        if (!ais || !ais.IMO) return null;

        return {
          IMO: ais.IMO,
          LOCODE: locode,
          AIS: ais,
        };
      })
      .filter(Boolean); // Remove any null entries

  if (documents.length > 0) {
  const bulkOps = documents.map(doc => ({
    updateOne: {
      filter: { IMO: doc.IMO },
      update: { $set: doc },
      upsert: true,
    },
  }));

  await ExpectedArrival.bulkWrite(bulkOps);
}


    res.status(200).json({ message: 'Expected arrivals saved', count: documents.length });
  } catch (error) {
    console.error('Error fetching/saving expected arrivals:', error.message);
    res.status(500).json({ error: 'Failed to fetch or save data' });
  }
});

export default router;
