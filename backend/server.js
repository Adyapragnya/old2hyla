import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import axios from 'axios';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import * as turf from '@turf/turf'; // Importing all turf functions as a namespace
const port = 5000;
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';
const router = express.Router();
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch' ; 
import moment from 'moment';


// For other imports, keep them as is
import alertRoutes from './routes/alertRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import organizationISMRoutes from './routes/organizationISMRoutes.js';
import userRoutes from './routes/userRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import permissionsRoutes from "./routes/permissions.js";
import settingsUsers from "./routes/settingsUsers.js";
import vesselApi from "./routes/vesselApi.js";
import seaPortsRouter from './routes/seaPorts.js';
import satIntervals from './routes/satIntervals.js';
import vesselDeleteDays from './routes/vesselDeleteDays.js';


import UserEmailLog from "./models/UserEmailLog.js";
import PendingEmail from "./models/PendingEmail.js";
import VesselApiMapping from './models/VesselApiMapping.js';

import verifyToken from './middleware/verifyToken.js';
import LoginUsers from './models/LoginUsers.js';
import TrackedVessel from './models/TrackedVessel.js';
import TrackedVesselByUser from './models/TrackedVesselByUser.js';
import PolygonGeofence from './models/PolygonGeofence.js';
import PolyCircleGeofence from './models/PolyCircleGeofence.js';
import PolyLineGeofence from './models/PolyLineGeofence.js';

import AisSatPull from './models/AisSatPull.js';
import TerrestrialGeofence from './models/TerrestrialGeofence.js';
import customFieldsRoutes from './routes/customFields.js';
import geolib from 'geolib';
import EmailForAlerts from './models/EmailForAlerts.js';
import EmailOptionsTosend from './models/EmailOptionsTosend.js';
import HylaGeofenceTypes from './models/HylaGeofenceTypes.js';
import SalesRadar from './models/SalesRadar.js';
import OpsRadar from './models/OpsRadar.js';
import SalesRadarHistory from './models/SalesRadarHistory.js';
import OpsRadarHistory from './models/OpsRadarHistory.js';
import EnableRoutesMenu from './models/EnableRoutesMenu.js';
import TableOrderFav from './models/TableOrderFav.js';
import ArchivedTrackedVesselByUser from './models/ArchivedTrackedVesselByUser.js';

import OrganizationISM from './models/OrganizationISM.js';
import SalesISM from './models/SalesISM.js';
import TrackedVesselISM from './models/TrackedVesselISM.js';

import Port from './models/Port.js';
import Voyages from './models/Voyages.js';
import JitReport from './models/JitReport.js';
import VesselBufferGeofence from './models/VesselBufferGeofence.js';
import Alert from './models/Alert.js';
import User from './models/User.js';
import ExpectedArrival from './models/ExpectedArrival.js';
import expectedArrival from './routes/expectedArrival.js'
import busboy from "busboy";

import PendingCustomAlertEmail from './models/PendingCustomAlertEmail.js';
import { aisFieldConfig } from "./aisFieldConfig.js";
import { checkAndHandleVesselTracking, cleanupDuplicateTrackedVessels } from './jobs/MaintainanceClearing.js';
import SubscriptionManagement from './jobs/SubscriptionManagement.js';
import Seaport from './models/Seaport.js';
import { getRoleBasedInterval } from './getRoleBasedInterval.js';

const app = express();
// Middleware to handle JSON requests
app.use(express.json());


dotenv.config();  // Load environment variables


// 🚀 Increase request size limits for JSON and URL-encoded data
app.use(express.json({ limit: "500mb" })); 
app.use(express.urlencoded({ limit: "500mb", extended: true }));


app.use(compression());

app.use(cors()); 


const mongoURI = process.env.MONGO_URI;
const reactAPI = process.env.REACT_APP_API_BASE_URL;

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully') )
.catch(err => console.error('MongoDB connection error:', err));


import nodemailer from 'nodemailer';
import Organization from './models/Organization.js';


let emailUser = '';
let emailPass = '';
let userkey = '';
let openaiAPI = '';


// Function to load email credentials from the database
async function loadEmailCredentials() {
  try {
      const emailOption = await EmailOptionsTosend.findOne({});
      if (emailOption) {
          emailUser = emailOption.user;
          emailPass = emailOption.pass;
          userkey=emailOption.aisuserkey;
          openaiAPI= emailOption.openaiApiKey;

          console.log('Email credentials loaded successfully.');
          // console.log(emailUser);
         
      } else {
          console.error('No email credentials found in the database.');
      }
  } catch (error) {
      console.error('Error loading email credentials:', error);
  }
}

// Load credentials when the server starts
loadEmailCredentials();


// Create a transporter object with SMTP transport
const transporter = nodemailer.createTransport({
  
    service: 'gmail', // or another email service provider
    auth: {
        user: emailUser,
        pass: emailPass,
    }
});



// Define Mongoose schema and model for vessel_master collection
const vesselSchema = new mongoose.Schema({
    imoNumber: Number,
    transportName: String,
    FLAG: String,
    StatCode5: String,
    transportCategory: String,
    transportSubCategory: String,
    SpireTransportType: String,
    buildYear: Number,
    GrossTonnage: Number,
    deadWeight: Number,
    LOA: Number,
    Beam: Number,
    MaxDraft: Number,
    ME_kW_used: Number,
    AE_kW_used: Number,
    RPM_ME_used: Number,
    Enginetype_code: String,
    subst_nr_ME: Number,
    Stofnaam_ME: String,
    Fuel_ME_code_sec: String,
    EF_ME: Number,
    Fuel_code_aux: String,
    EF_AE: Number,
    EF_gr_prs_ME: Number,
    EF_gr_prs_AE_SEA: Number,
    EF_gr_prs_AE_BERTH: Number,
    EF_gr_prs_BOILER_BERTH: Number,
    EF_gr_prs_AE_MAN: Number,
    EF_gr_prs_AE_ANCHOR: Number,
    NO_OF_ENGINE_active: Number,
    CEF_type: Number,
    Loadfactor_ds: Number,
    Speed_used_: Number,
    CRS_min: Number,
    CRS_max: Number,
    Funnel_heigth: Number,
    MMSI: Number,
    updatedAt: Date,
    Engine_tier: Number,
    NOx_g_kwh: Number,
    summer_dwt: Number,
    transportNo: Number,
    transportType: String
});

// Index for search optimization
vesselSchema.index({ transportName: 'text' });

const Vessel = mongoose.model('vessel_master', vesselSchema, 'vessel_master');

export default Vessel;

const voyageSchema = new mongoose.Schema({
    VoyageId : String,
    IMO: Number,
    NAME: String,
    voyageDetails: {
    departurePort: String,     // Port of departure
    arrivalPort: String,       // Port of arrival
    departureDate:String,     // Departure date in ISO 8601 format
    arrivalDate: String,       // Estimated arrival date in ISO 8601 format
    actualArrivalDate: String, // Actual arrival date in ISO 8601 format
    voyageDuration: String,    // Duration of the voyage in hours
    status: String             // Status of the voyage (e.g., underway, completed, delayed)
  },
  cargo : 
    {
      cargoType: String,        // Type of cargo being transported
      quantity: Number,         // Quantity of cargo in tons
      unit: String             // Unit of measurement (e.g., tons, cubic meters)
    },

  crew: 
    {
      name: String,             // Name of the crew member
      position: String,         // Position on the vessel (e.g., captain, engineer)
      nationality: String       // Nationality of the crew member
    },
  logs: 
    {
      timestamp: String,        // Timestamp of the log entry in ISO 8601 format
      event: String             // Description of the event (e.g., departure, arrival, incident)
    }
  
}, { timestamps: true });

const voyageDetail = mongoose.model('voyageDetails', voyageSchema, 'voyageDetails');


// / GET endpoint with pagination and search filtering
app.get('/api/vessel-master/getData', async (req, res) => {
  try {
    const { search } = req.query;
    // console.log(req.query);
   

    const query = {};

    if (search) {
      const isNumeric = !isNaN(search);
      const conditions = [];

      // For numeric search terms, match imoNumber exactly.
      if (isNumeric) {
        conditions.push({ imoNumber: Number(search) });
      }

      // Add regex search for text fields.
      conditions.push(
        { transportName: { $regex: search, $options: 'i' } },
       
      );

      query.$or = conditions;
    }

    // Query the database with pagination
    const vessel = await Vessel.find(query);
    

    res.json({ vessel});
  } catch (error) {
    console.error('Error fetching master vessels:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/vessel-master/add', async (req, res) => {
  try {
    console.log(req.body.imoNumber);

    const existingMaster = await Vessel.findOne({imoNumber:req.body.imoNumber});

    if (existingMaster) {
      return res.status(400).json({ message: "Vessel with this IMO Number already exists." });
    }
  
    // Create a new vessel document using the request body.
    const newVessel = new Vessel(req.body);
    
    // Save the document to the database.
    const savedVessel = await newVessel.save();

    // Return a success response with the newly created document.
    res.status(201).json({ vessel: savedVessel });
  } catch (err) {
    console.error('Error adding new master vessel:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/getdata-org/getData', async (req, res) => {
  try {
  let organizations = await User.find(); // Fetch data from the database
 
  // Decrypt necessary fields for each organization
  organizations = organizations.map(org => ({
  ...org._doc,
  contactEmail: decryptData(org.contactEmail),
  userEmail: org.userEmail,
  userContactNumber: decryptData(org.userContactNumber),
  // Decrypt other fields as needed
  }));
 
  res.status(200).json(organizations);
  } catch (error) {
  res.status(500).json({ message: 'Error retrieving data', error: error.message });
  }
 });


// Update vessel endpoint: updates only changed fields based on imoNumber
app.put('/api/updated-vessel-master/:imoNumber', async (req, res) => {
  try {
    const imoNumber = Number(req.params.imoNumber);
    const updateData = req.body;

    // Optionally, add an updatedAt field
    updateData.updatedAt = new Date();

    // Find the vessel by imoNumber and update it
    const updatedVessel = await Vessel.findOneAndUpdate(
      { imoNumber },
      { $set: updateData },
      { new: true }  // return the updated document
    );

    if (!updatedVessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    res.json(updatedVessel);
  } catch (error) {
    console.error('Error updating vessel:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// app.post('/api/updateGeofence', async (req, res) => {
//     const { name, geofenceStatus, geofenceInsideTime } = req.body;

//     try {
//         // Find the vessel by name in the AIS data
//         const vessel = await TrackedVessel.findOne({ 'AIS.NAME': name });

//         // Check if the vessel exists
//         if (!vessel) {
//             return res.status(404).send({ message: 'Vessel not found' });
//         }

//         // If vessel is already inside the geofence, return without updating
//         if (vessel.GeofenceStatus === 'Inside') {
//             return res.status(200).send({ message: 'Vessel is already inside the geofence' });
//         }

//         // Update geofence status and inside time for the vessel
//         vessel.GeofenceStatus = geofenceStatus;
//         vessel.GeofenceInsideTime = geofenceInsideTime;
//         vessel.geofenceFlag = 'Entered'; // Update geofence flag

//         // Save the updated vessel information
//         await vessel.save();

//         res.status(200).send({ message: 'Geofence status updated successfully' });
//     } catch (error) {
//         console.error('Error updating geofence status:', error);
//         res.status(500).send({ message: 'Server error' });
//     }
// });


// const vesselGeofenceHistorySchema = new mongoose.Schema({
//     vesselId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackedVessel', required: true },
//     vesselName: String,
//     entries: [{
//         geofenceName: String,
//         entryTime: Date,
//         exitTime: Date,
//         currentStatus: { type: String, enum: ['Inside', 'Outside'], default: 'Outside' }, // status for each entry
//     }],
//     updatedAt: { type: Date, default: Date.now }
// });

// const VesselGeofenceHistory = mongoose.model('VesselGeofenceHistory', vesselGeofenceHistorySchema, 'vesselGeofenceHistories');

// app.get('/api/vesselGeofenceHistory/:id', async (req, res) => {
//     const vesselId = req.params.id;

//     try {
//         const history = await VesselGeofenceHistory.findOne({ vesselId });
//         if (!history) {
//             return res.status(404).send({ message: 'Vessel history not found' });
//         }

//         res.status(200).send(history);
//     } catch (error) {
//         console.error('Error fetching vessel history:', error);
//         res.status(500).send({ message: 'Server error' });
//     }
// });

// app.post('/api/updateGeofenceHistory', async (req, res) => {
//     const { vesselId, entries } = req.body;
//     try {
//         await VesselGeofenceHistory.findOneAndUpdate(
//             { vesselId },
//             { entries },
//             { upsert: true, new: true }
//         );
//         res.status(200).send({ message: 'Vessel geofence history updated successfully' });
//     } catch (error) {
//         console.error('Error updating vessel history:', error);
//         res.status(500).send({ message: 'Server error' });
//     }
// });

// starts geofence CRUD 
// polygon operations

app.post('/api/addpolygongeofences', async (req, res) => {
  try {
  const {  geofenceName, geofenceType, type,seaport, remarks, coordinates } = req.body;

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return res.status(400).json({ error: 'Coordinates are required and should be an array.' });
  }

  const newGeofence = new PolygonGeofence({
    geofenceName,
    type,
    seaport,
    geofenceType,
    remarks,
    coordinates,
  });

 
    const savedGeofence = await newGeofence.save();
    res.status(201).json(savedGeofence);
  } catch (error) {
    console.error('Error saving polygon geofence:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

 app.get('/api/polygongeofences', async (req, res) => {
  try {
    const polygonGeofences = await PolygonGeofence.find();
    res.json(polygonGeofences);
  } catch (error) {
    console.error('Error fetching polygon geofences:', error);
    res.status(500).json({ error: 'Failed to fetch polygon geofences' });
  }
});

app.put('/api/update-polygon-geofence/:id', async (req, res) => {
  try {
    const { coordinates } = req.body;
    const updatedGeofence = await PolygonGeofence.findOneAndUpdate(
      { _id : req.params.id },
      { coordinates },
      { new: true }
    );
    if (!updatedGeofence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    res.status(200).json({ message: 'Geofence updated', geofence: updatedGeofence });
  } catch (error) {
    console.error('Error updating geofence:', error);
    res.status(500).json({ message: 'Error updating geofence' });
  }
});

app.delete('/api/delete-polygon-geofence/:id', async (req, res) => {
  try {
   
    await PolygonGeofence.findOneAndDelete({ _id : req.params.id});
    res.status(200).send('Geofence deleted successfully');
  } catch (error) {
    res.status(500).json({ message: 'Error deleting geofence', error });
  }
});

// polycircle operations

app.post('/api/addcirclegeofences', async (req, res) => {
    
    const { geofenceName,type , geofenceType,seaport, remarks, coordinates } = req.body;

    // Perform additional checks if needed
    if (!coordinates || coordinates.length === 0 || coordinates[0].radius <= 0) {
        return res.status(400).json({ error: 'Invalid coordinates or radius.' });
    }

    const geofence = new PolyCircleGeofence({
        geofenceName,
        type,
        geofenceType,
        seaport,
        remarks,
        coordinates: coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng, radius: coord.radius })),
    });

    try {
        await geofence.save();
        res.status(201).json({ message: 'Circle geofence saved successfully!' });
    } catch (error) {
        console.error('Error saving geofence:', error); // Log the error
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/circlegeofences', async (req, res) => {
    try {
        const geofences = await PolyCircleGeofence.find(); // Adjust if necessary
        res.status(200).json(geofences);
    } catch (error) {
        console.error('Error fetching circle geofences:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/update-polycircle-geofence/:id', async (req, res) => {
  try {
    const { coordinates } = req.body;
    const updatedGeofence = await PolyCircleGeofence.findOneAndUpdate(
      { _id : req.params.id },
      { coordinates },
      { new: true }
    );
    if (!updatedGeofence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    res.status(200).json({ message: 'Geofence updated', geofence: updatedGeofence });
  } catch (error) {
    console.error('Error updating geofence:', error);
    res.status(500).json({ message: 'Error updating geofence' });
  }
});

app.delete('/api/delete-polycircle-geofence/:id', async (req, res) => {
  try {
      let id = req.params.id.trim(); // ✅ Remove extra spaces and newlines

      console.log("Received DELETE request for ID:", JSON.stringify(id)); // Debugging log

      if (!mongoose.Types.ObjectId.isValid(id)) {
          console.warn("Invalid ObjectId format:", id);
          return res.status(400).json({ message: 'Invalid ID format' });
      }

      const deletedGeofence = await PolyCircleGeofence.findByIdAndDelete(id);

      if (!deletedGeofence) {
          console.warn("Geofence not found for ID:", id);
          return res.status(404).json({ message: 'Geofence not found' });
      }

      console.log("Deleted geofence:", deletedGeofence);
      res.status(200).json({ message: 'Geofence deleted successfully', geofence: deletedGeofence });

  } catch (error) {
      console.error("Error deleting geofence:", error);
      res.status(500).json({ message: 'Error deleting geofence', error });
  }
});


// polyline operations
 
app.post('/api/addpolylinegeofences', async (req, res) => {
  const { geofenceName,  type, geofenceType,seaport, remarks, coordinates } = req.body;

  try {
      const newPolylineGeofence = new PolyLineGeofence({
          geofenceName,
          type,
          geofenceType,
          seaport,
          remarks,
          coordinates,
      });

      await newPolylineGeofence.save();
      res.status(201).json(newPolylineGeofence);
  } catch (error) {
      console.error('Error saving polyline geofence:', error);
      res.status(500).json({ error: 'Failed to save polyline geofence data.' });
  }
});

app.get('/api/polylinegeofences', async (req, res) => {
  try {
      const polylineGeofences = await PolyLineGeofence.find();
      res.status(200).json(polylineGeofences);
     
  } catch (error) {
      console.error('Error fetching polyline geofences:', error);
      res.status(500).json({ error: 'Error fetching polyline geofences' });
  }
});

app.put('/api/update-polyline-geofence/:id', async (req, res) => {
  try {
    const { coordinates } = req.body;
    const updatedGeofence = await PolyLineGeofence.findOneAndUpdate(
      { _id : req.params.id },
      { coordinates },
      { new: true }
    );
    if (!updatedGeofence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    res.status(200).json({ message: 'Geofence updated', geofence: updatedGeofence });
  } catch (error) {
    console.error('Error updating geofence:', error);
    res.status(500).json({ message: 'Error updating geofence' });
  }
});

app.delete('/api/delete-polyline-geofence/:id', async (req, res) => {
  try {
   
    await PolyLineGeofence.findOneAndDelete({ _id : req.params.id});
    res.status(200).send('Geofence deleted successfully');
  } catch (error) {
    res.status(500).json({ message: 'Error deleting geofence', error });
  }
});

 // ends geofence CRUD


 app.post('/api/add-terrestrial-Advancedgeofence', async (req, res) => {
  try {
  const {geofenceName, geofenceType, type,seaport, remarks, coordinates } = req.body;

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return res.status(400).json({ error: 'Coordinates are required and should be an array.' });
  }

  const newGeofence = new TerrestrialGeofence({
    geofenceName,
    type,
    seaport,
    geofenceType,
    remarks,
    coordinates,
  });

 
    const savedGeofence = await newGeofence.save();
    res.status(201).json(savedGeofence);
  } catch (error) {
    console.error('Error saving Advaned geofence:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

   // API to fetch polygon geofences
   app.get('/api/polygonTerrestrialGeofences-2', async (req, res) => {
    try {
      const TerrestrialGeofences = await TerrestrialGeofence.find();

    
      res.json(TerrestrialGeofences);
    } catch (error) {
      console.error('Error fetching polygon terrestrial geofences:', error);
      res.status(500).json({ error: 'Failed to fetch polygon terrestrial geofences' });
    }
  });

  app.put('/api/update-terrestrial-advanced-geofence/:id', async (req, res) => {
    try {
      const { coordinates } = req.body;
      const updatedGeofence = await TerrestrialGeofence.findOneAndUpdate(
        { _id : req.params.id },
        { coordinates },
        { new: true }
      );
      if (!updatedGeofence) {
        return res.status(404).json({ message: 'terrestrial Geofence not found' });
      }
      res.status(200).json({ message: 'terrestrial Geofence updated', geofence: updatedGeofence });
    } catch (error) {
      console.error('Error updating terrestrial geofence:', error);
      res.status(500).json({ message: 'Error updating terrestrial geofence' });
    }
  });

  app.delete('/api/delete-terrestrial-advanced-geofence/:id', async (req, res) => {
    try {
     
      await TerrestrialGeofence.findOneAndDelete({ _id : req.params.id});
      res.status(200).send('terrestrial Geofence deleted successfully');
    } catch (error) {
      res.status(500).json({ message: 'Error deleting terrestrial geofence', error });
    }
  });


  app.post('/api/save-vessel-buffer', async (req, res) => {
    try {
      const { IMO, NAME, TIMESTAMP, LATITUDE, LONGITUDE, radius } = req.body;
  
      // Validation check
      if (!IMO || !NAME || !TIMESTAMP || !LATITUDE || !LONGITUDE || !radius ) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const newVesselBuffer = new VesselBufferGeofence({
        IMO,
        NAME,
        TIMESTAMP,
        LATITUDE,
        LONGITUDE,
        radius,
        
      });
  
      await newVesselBuffer.save();
  
      res.status(201).json({ message: 'Vessel buffer geofence saved successfully' });
    } catch (error) {
      console.error('Error saving vessel buffer:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.get('/api/get-vessel-buffer-geofences', async (req, res) => {
  
  
    try {
      const data = await VesselBufferGeofence.find(); // Adjust if necessary
          res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching vessel buffer geofences data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.put('/api/update-vessel-buffer-geofence/:id', async (req, res) => {
    try {

      const { radius } = req.body;

        // Check if the provided ID exists in the database
        const existingGeofence = await VesselBufferGeofence.findById(req.params.id);
        if (!existingGeofence) {
            console.warn("Geofence not found for ID:", req.params.id);
            return res.status(404).json({ message: 'Vessel Buffer Geofence not found' });
          }

      const updatedGeofence = await VesselBufferGeofence.findOneAndUpdate(
        { _id : req.params.id },
        { radius },
        { new: true }
      );
      console.log(`Updated vessel buffer geofence- ${req.params.id}`);
      res.status(200).json({ message: 'Vessel Buffer Geofence updated', geofence: updatedGeofence });
    } catch (error) {
      console.error('Error updating vessel buffer geofence:', error);
      res.status(500).json({ message: 'Error updating vessel buffer geofence' });
    }
  });

  app.delete('/api/delete-vessel-buffer-geofence/:id', async (req, res) => {
    try {
    
      await VesselBufferGeofence.findOneAndDelete({ _id : req.params.id});
      res.status(200).send('Vessel Buffer Geofence deleted successfully');
    } catch (error) {
      res.status(500).json({ message: 'Error deleting Vessel Buffer geofence', error });
    }
  });

//   app.delete('/api/delete-vessel-buffer-geofence/:id', async (req, res) => { 
//     try {
//         console.log("Received DELETE request for ID:", req.params.id);

//         if (!mongoose.Types.ObjectId.isValid(req.params.id.trim())) {
//             return res.status(400).json({ message: 'Invalid ID format' });
//         }

//         const deletedGeofence = await VesselBufferGeofence.findByIdAndDelete(req.params.id.trim());

//         if (!deletedGeofence) {
//             return res.status(404).json({ message: 'Vessel Buffer Geofence not found' });
//         }

//         res.status(200).json({ message: 'Vessel Buffer Geofence deleted successfully' });

//     } catch (error) {
//         console.error("Error deleting geofence:", error);
//         res.status(500).json({ message: 'Error deleting geofence', error });
//     }
// });

// app.get('/api/delete-vessel-buffer-geofence/:id', (req, res) => {
//   console.log("Received GET request for ID:", req.params.id);
//   res.send('Testing GET method');
// });

  
  


  // start

  // app.post('/api/geofences', async (req, res) => {
  //   try {
  //     const { geofenceId, geofenceName, geofenceType, coordinates } = req.body;
  //     const newGeofence = new Geofence({
  //       geofenceId,
  //       geofenceName,
  //       geofenceType,
  //       coordinates
  //     });
  
  //     await newGeofence.save();
  //     res.status(201).json({ message: 'Geofence created', geofence: newGeofence });
  //   } catch (error) {
  //     console.error('Error saving geofence:', error);
  //     res.status(500).json({ message: 'Error saving geofence' });
  //   }
  // });
  

  // Get all Geofences
  // app.get('/api/geofences', async (req, res) => {
  //   try {
  //     const geofences = await PolygonGeofence.find();
  //     res.status(200).json(geofences);
  //   } catch (error) {
  //     console.error('Error fetching geofences:', error);
  //     res.status(500).json({ message: 'Error fetching geofences' });
  //   }
  // });

  

 

  // end

//   const PolylineGeofenceSchema = new mongoose.Schema({
//     geofenceId: String,
//     geofenceName: String,
//     type: String,
//     geofenceType: String,
//     date: String,
//     remarks: String,
//     coordinates: Array,
// });

// const PolylineGeofence = mongoose.model('PolylineGeofence', PolylineGeofenceSchema);



app.post('/api/add-combined-data', async (req, res) => {
    try {

   
        // console.log('Combined Data Request Body:', req.body); // Log the request body
        

        // Extract AIS data and other details from the request body
        const { IMO, AIS , AIS_EXTRA, SpireTransportType, FLAG, GrossTonnage, deadWeight,email } = req.body;
       console.log(req.body);
        
        if (!AIS ) {
            return res.status(400).json({ error: 'AIS data is missing' });
        }

        if (!SpireTransportType ) {
          return res.status(400).json({ error: 'SpireTransportType is missing' });
      } 
        // console.log('Email from body:', email);

        const currentTime = new Date(); 
        // Create a new CombinedData document
        const newCombinedData = new TrackedVessel({ IMO,
          AIS, 
          AIS_EXTRA: AIS_EXTRA || null,
          SpireTransportType, 
          FLAG, 
          GrossTonnage, 
          deadWeight,
          trackingFlag: true,
          lastFetchTime: currentTime,
          GeofenceStatus: null, 
          geofenceFlag: null,
          GeofenceInsideTime: null, 
          AisPullGfType: null });
    
        // Save the document to the database
        await newCombinedData.save();
        console.log('Combined data saved successfully');
        res.status(201).json({ message: 'Combined data saved successfully' });

        // Extract vessel details
        const vesselName = AIS.NAME;
        const imo = AIS.IMO;
        const zone = AIS.ZONE || 'N/A'; // Use 'N/A' if ZONE is not provided
        const flag = FLAG || 'N/A'; // Use 'N/A' if FLAG is not provided

        // List of email addresses
        const emailAddresses = ['tech.adyapragnya@gmail.com, sales@adyapragnya.com'];
        // const emailAddresses = ['tech.adyapragnya@gmail.com'];

        // to: 'hemanthsrinivas707@gmail.com, sales@adyapragnya.com,kdalvi@hylapps.com, abhishek.nair@hylapps.com',
        // Send an email notification to each recipient individually
      
        
    
        

          // Send WhatsApp message
  //         const accessToken = 'EAAPFZBVZCcJpkBO1icFVEUAqZBZA6SOw614hQaLmsooJTLIdR2njKZCL9G7z9O2NSLZAZAHTAMGqhaFSlV0DdMyqZBhy13zkZCZBI6OO8hUp28c6sFmpNPAjv1V8bVOVisfGZCOXyJHrnZBxZBQAG9gGI7Wt6gUqI9Qs1pYwl2RmdZAWPwKNJ0i0NAg1nL8MtPZCfLDzLMW9mWaNjzLsZAsc7qUnLOZBWR0bZCYQkDBqegmngZD';
  //         const phoneNumberId = '481471688383235';

  //         const date = new Date();
  //         const options = { day: '2-digit', month: 'short', year: '2-digit' };
  //         const formattedDate = date.toLocaleDateString('en-GB', options).replace(',', '');
  
  //         const whatsappMessage = {
  //             messaging_product: 'whatsapp',
  //             to: '+916382125732', // Receiver's WhatsApp number in international format
  //             type: 'text',
  //             text: {
  //                 body: `${vesselName} has been added to your tracking system as of today ${formattedDate}. You will receive real-time updates on its location and movements.
  
  // Details of the ship:
  // Name: ${vesselName}
  // IMO: ${imo}
  
  // This vessel will be tracked for the next 30 days. Contact admin@hylapps.com for further assistance.`
  //             }
  //         };
  
  //         await axios.post(`https://graph.facebook.com/v15.0/${phoneNumberId}/messages`, whatsappMessage, {
  //             headers: {
  //                 Authorization: `Bearer ${accessToken}`,
  //                 'Content-Type': 'application/json'
  //             }
  //         });

        // res.status(201).json({ message: 'Combined data saved successfully and emails sent' });
    } catch (error) {
        console.error('Error adding combined data:', error);
        res.status(500).json({ error: 'Error adding combined data' });
    }
  });



  app.post('/api/add-vessel-tracked-by-user', async (req, res) => {
    try {

    
        // Destructure the required fields from req.body
        const { loginUserId, email, IMO, AdminId, OrgId, AddedDate, vesselName } = req.body;

        // Check if all required fields are provided
        if (!loginUserId || !email || !IMO || !vesselName || AddedDate === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

         // Parallel DB queries for performance
    const [vessel, user, existing] = await Promise.all([
      TrackedVessel.findOne({ IMO: parseInt(IMO) }),
      LoginUsers.findOne({ loginUserId }).select('role orgRef'),
      TrackedVesselByUser.findOne({ loginUserId, email, IMO, AdminId, OrgId })
    ]);

    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent duplicates
    if (existing) {
      return res.status(409).json({ error: 'This vessel is already tracked by the user' });
    }

    // Build new document
    const newTrackedVesselData = {
      loginUserId,
      email,
      IMO,
      AdminId,
      OrgId,
      AddedDate,
    };

    // Add orgRef only if role qualifies
    const orgRoles = ['organization admin', 'organizational user'];
    if (orgRoles.includes(user.role) && user.orgRef) {
      newTrackedVesselData.orgRef = user.orgRef;
    }

    await TrackedVesselByUser.create(newTrackedVesselData);

        res.status(201).json({ message: 'Vessel tracked by user added successfully', vessel });

           
        const transporter = nodemailer.createTransport({
          service: 'gmail', // or another email service provider
          auth: {
              user: emailUser,
              pass: emailPass,
          },
      });
       
        
            const date = new Date();
            const options = { day: '2-digit', month: 'short', year: '2-digit' };
            const formattedDate = date.toLocaleDateString('en-GB', options).replace(',', '');
         
            const imo = IMO;
            
          
            await transporter.sendMail({

                from: emailUser, // sender address
                bcc: email, // individual receiver address
                subject: `HYLA Alert:${vesselName} added to tracking`, // Subject line
                text: `${vesselName} has been added to your tracking system as of today ${formattedDate}. You will receive real-time updates on its location and movements.

Details of the ship:
Name: ${vesselName}
IMO: ${imo}

${vesselName} will be tracked for the next 30 days. Should you require any further assistance, contact admin@hylapps.com.

Thank You,
HYLA Admin
www.greenhyla.com
`,
            });
            
        res.json({ message: 'Vessel added and email sent' });
        
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
});



app.post('/api/add-Ops-data-for-adding-vessel', async (req, res) => {
  try {
      // Destructure the required fields from req.body
      const { loginUserId, email, IMO, AdminId, OrgId, AddedDate, vesselName } = req.body;

     console.log(req.body);
      // Check if all required fields are provided
      if (!loginUserId || !email || !IMO || !vesselName || AddedDate === undefined) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

     


      const newOps = new OpsRadar({
        Flag: "individual",
        loginUserId,
        AdminId,
        OrgId,
        IMO,
        CaseId: 0,
        Agent: "-",
        AgentName: "-",
        Info1: "-",
        ETA : "-"

      })

      await newOps.save();


      res.status(201).json({ message: 'ops added successfully' });

         
     
        
          
        
         
      
  } catch (error) {
      console.error('Error adding ops data:', error);
      res.status(500).json({ error: 'Error adding ops data' });
  }
});


app.get('/api/get-vessel-tracked-by-user', async (req, res) => {
  try {
      
      const vessels = await TrackedVesselByUser.find();
     

      res.json(vessels);
  } catch (error) {
      console.error('Error fetching vessel tracked by users:', error);
      res.status(500).json({ error: 'Error fetching vessel tracked by users' });
  }
});




app.get('/api/get-ops-table-order', async (req, res) => {
  try {
      
      const orders = await TableOrderFav.find();
     

      res.json(orders);
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Error fetching orders' });
  }
});

app.get('/api/get-vessels-by-role', async (req, res) => {
  try {
    const { role, userId } = req.query;

    let vessels = [];

    if (role === 'hyla admin') {
      // Fetch all vessels
      vessels = await TrackedVessel.find({});
    } else {
      let filter = {};
      if (role === 'organization admin' || role === 'organizational user') {
        // Extract OrgId from userId
        let OrgId = userId.includes('_') ? userId.split('_')[1] : userId.split('_')[0];
        filter = { OrgId };
      } else if (role === 'guest') {
        filter = { loginUserId: userId };
      }

      // Fetch IMO values from TrackedVesselByUser
      const trackedVessels = await TrackedVesselByUser.find(filter);
      const imoValues = trackedVessels.map(vessel => vessel.IMO);

      // Fetch actual vessel data from TrackedVessel
      vessels = await TrackedVessel.find({ IMO: { $in: imoValues } });
    }

    res.json(vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Error fetching vessels' });
  }
});

app.get('/api/get-vessels-by-role-ops-and-sales', async (req, res) => {
  try {
    const { role, userId } = req.query;

    let vessels = [];

    if (role === 'hyla admin') {
      
      // vessels = await TrackedVessel.find({});
    } else {
      let filter = {};
      if (role === 'organization admin' || role === 'organizational user') {
        // Extract OrgId from userId
        let OrgId = userId.includes('_') ? userId.split('_')[1] : userId.split('_')[0];
        filter = { OrgId };
      } else if (role === 'guest') {
        filter = { loginUserId: userId };
      }

      // Fetch IMO values from TrackedVesselByUser
      const trackedVessels = await TrackedVesselByUser.find(filter);
      const imoValues = trackedVessels.map(vessel => vessel.IMO);

      // Fetch actual vessel data from TrackedVessel
      vessels = await TrackedVessel.find({ IMO: { $in: imoValues } });
    }
    
    res.json(vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Error fetching vessels' });
  }
});

app.get('/api/get-trackedVessels-and-favoriteVessels-by-role', async (req, res) => {
  try {
    const { role, userId } = req.query;

    let vessels = [];

    // Helper to extract OrgId from userId
    const getOrgIdFromUserId = (userId) => {
      return userId.includes('_') ? userId.split('_')[1] : userId.split('_')[0];
    };

    if (role === 'hyla admin') {
      // Hyla admin gets all tracked vessels
      vessels = await TrackedVessel.find({});

      // Favorites only for the hyla admin user
      const favoriteTrackedByAdmin = await TrackedVesselByUser.find({
        loginUserId: userId,
        favorite: true
      });
      const favoriteIMOSet = new Set(favoriteTrackedByAdmin.map(doc => doc.IMO));
      const favoriteVessels = vessels.filter(v => favoriteIMOSet.has(v.IMO));

      return res.json({ trackedVessels: vessels, favoriteVessels });
    }

    if (role === 'organization admin' || role === 'organizational user') {
      const OrgId = getOrgIdFromUserId(userId);

      // Get all tracked vessels in the organization
      const trackedVesselsByOrg = await TrackedVesselByUser.find({ OrgId });
      const imoValues = trackedVesselsByOrg.map(vessel => vessel.IMO);
      vessels = await TrackedVessel.find({ IMO: { $in: imoValues } });

      // Get only the org admin's favorite vessels
      const adminFavorites = await TrackedVesselByUser.find({
        // loginUserId: userId,
        OrgId,
        favorite: true
      });
      const favoriteIMOSet = new Set(adminFavorites.map(v => v.IMO));
      const favoriteVessels = vessels.filter(vessel => favoriteIMOSet.has(vessel.IMO));

      return res.json({ trackedVessels: vessels, favoriteVessels });
    }

    // For organizational user or guest
    if (role === 'guest') {
      // Get only user's tracked vessels
      const trackedVesselsByUser = await TrackedVesselByUser.find({ loginUserId: userId });
      const imoValues = trackedVesselsByUser.map(vessel => vessel.IMO);
      vessels = await TrackedVessel.find({ IMO: { $in: imoValues } });

      // Identify user's favorite vessels
      const favoriteIMOSet = new Set(
        trackedVesselsByUser.filter(vessel => vessel.favorite === true).map(vessel => vessel.IMO)
      );
      const favoriteVessels = vessels.filter(vessel => favoriteIMOSet.has(vessel.IMO));

      return res.json({ trackedVessels: vessels, favoriteVessels });
    }

    // Fallback if role is not recognized
    return res.status(400).json({ error: 'Invalid role provided' });

  } catch (error) {
    console.error('Error fetching vessels:', error);
    return res.status(500).json({ error: 'Error fetching vessels' });
  }
});


// Update favorite status for multiple vessels
app.post('/api/set-vessels-favorites', async (req, res) => {
  try {
    const { userId, selectedImos, role, email } = req.body;

    if (!userId || !Array.isArray(selectedImos) || !email) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const bulkOps = [];

    for (const imo of selectedImos) {
      const existing = await TrackedVesselByUser.findOne({ loginUserId: userId, IMO: imo });

      if (existing) {
        // Update existing document to favorite = true
        bulkOps.push({
          updateOne: {
            filter: { loginUserId: userId, IMO: imo },
            update: { $set: { favorite: true } }
          }
        });
      } else {
        // Only Hyla Admin and Org Admins can favorite untracked vessels
        if (role === 'hyla admin' || role === 'organization admin') {
          const newDoc = {
            loginUserId: userId,
            email,
            IMO: imo,
            favorite: true,
            AddedDate: new Date(),
            OrgId: null,
            AdminId: null
          };

          if (role === 'organization admin') {
            const OrgId = userId.includes('_') ? userId.split('_')[1] : userId.split('_')[0];
            newDoc.OrgId = OrgId;
            newDoc.AdminId = userId;
          }

          bulkOps.push({
            insertOne: { document: newDoc }
          });
        }
        // Org user or guest trying to favorite untracked vessel — skip
      }
    }

    if (bulkOps.length > 0) {
      await TrackedVesselByUser.bulkWrite(bulkOps);
    }

    res.json({ message: "Favorites updated successfully", updatedCount: bulkOps.length });

  } catch (error) {
    console.error("Error updating favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// remove favorite vessels
app.post('/api/remove-vessel-favorite', async (req, res) => {
  try {
      const { userId, imo } = req.body;

      if (!userId || !imo) {
          return res.status(400).json({ message: "Invalid request data" });
      }

       // Find the tracked vessel by user
    const existing = await TrackedVesselByUser.findOne({ loginUserId: userId, IMO: imo });

    if (!existing) {
      return res.status(404).json({ message: "Vessel not found in tracked list" });
    }

    // Only allow users to unfavorite if the vessel exists in their list
    if (existing.favorite !== true) {
      return res.status(400).json({ message: "Vessel is not marked as favorite" });
    }

    // Update favorite to false
    const result = await TrackedVesselByUser.updateOne(
      { loginUserId: userId, IMO: imo },
      { $set: { favorite: false } }
    );

      res.json({ message: "Vessel removed from favorites successfully" });
  } catch (error) {
      console.error("Error removing favorite vessel:", error);
      res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/get-vessel-tracked-by-user-based-on-OrgId', async (req, res) => {
  try {
    const { OrgId } = req.query;
 
   

      // Filter vessels based on orgId (this can be done in the database query itself)
     const filteredVessels = await TrackedVesselByUser.find({OrgId : OrgId});
     
     
   
      // Return only the IMO values (or full vessel data as needed)
     const imoValues = filteredVessels.map(vessel => vessel.IMO);
   
        // Filter vessels in the TrackedVessel collection where IMO is in imoValues array
    const vesselFilter = await TrackedVessel.find({ IMO: { $in: imoValues } });


      res.json(vesselFilter);
      // console.log(vesselFilter);
  } catch (error) {
      console.error('Error fetching vessel tracked by users:', error);
      res.status(500).json({ error: 'Error fetching vessel tracked by users' });
  }
});

// sales vessels
app.get('/api/get-salesvessels-based-on-OrgId', async (req, res) => {
  try {
    const { OrgId } = req.query;
 
   
      



      // Filter vessels based on orgId (this can be done in the database query itself)
     const filteredVessels = await TrackedVesselByUser.find({OrgId : OrgId});
     
     
   
      // Return only the IMO values (or full vessel data as needed)
     const imoValues = filteredVessels.map(vessel => vessel.IMO);
   
        // Filter vessels in the TrackedVessel collection where IMO is in imoValues array
    const vesselFilter = await TrackedVessel.find({ IMO: { $in: imoValues } });

    const filteredSalesData = await SalesRadar.find({OrgId : OrgId});

    // Extract the list of IMO values from filteredSalesData
    const salesImos = new Set(filteredSalesData.map(sale => sale.IMO));

    // Filter vesselFilter to only include vessels with IMOs present in salesImos
    const finalVessels = vesselFilter.filter(vessel => salesImos.has(vessel.IMO));


      res.json(finalVessels);


      // console.log(vesselFilter);
  } catch (error) {
      console.error('Error fetching vessel tracked by users:', error);
      res.status(500).json({ error: 'Error fetching vessel tracked by users' });
  }
});


app.get('/api/get-vessel-tracked-by-user-based-on-loginUserId', async (req, res) => {
  try {
    const { loginUserId } = req.query;
 
   

      // Filter vessels based on loginUserId (this can be done in the database query itself)
     const filteredVessels = await TrackedVesselByUser.find({loginUserId : loginUserId});
     
     
   
      // Return only the IMO values (or full vessel data as needed)
     const imoValues = filteredVessels.map(vessel => vessel.IMO);
   
        // Filter vessels in the TrackedVessel collection where IMO is in imoValues array
    const vesselFilter = await TrackedVessel.find({ IMO: { $in: imoValues } });


      res.json(vesselFilter);
      // console.log(vesselFilter);
  } catch (error) {
      console.error('Error fetching vessel tracked by users:', error);
      res.status(500).json({ error: 'Error fetching vessel tracked by users' });
  }
});


app.get('/api/get-routes-menu-enabling-ids', async (req, res) => {
  try {
      
      const OrgIds = await EnableRoutesMenu.findOne();
     

      res.json(OrgIds);
  } catch (error) {
      console.error('Error fetching orgIds:', error);
      res.status(500).json({ error: 'Error fetching orgIds' });
  }
});


  // app.post("/api/upload-ops-data-bulk", async (req, res) => {

  //   try {
  //     console.log(req.body);
  //     const data = req.body; // Get the sales data from the request
  //     const imoNumbers = data.map(row => row.IMO); // Extract IMO numbers from the data
  //     const foundImos = [];
  //     let notFoundImos = [];
  //     const errorMessages = [];
  //     const successCount = [];
  //     const failureCount = [];
  //     const userTrackedData = []; // Array to store user-tracked vessel data
      
  //     // Extract user details from the first row (assuming all rows have the same user context)
  //     const { loginUserId, email, AdminId, OrgId } = data[0]; 
     
  
  //     // Check which IMOs exist in the TrackedVessel collection
  //     const trackedVessels = await TrackedVessel.find({ IMO: { $in: imoNumbers } }).select('IMO');
  //     const trackedImos = trackedVessels.map(vessel => vessel.IMO);
      
  //     // Separate found and not found IMOs
  //     for (const imo of imoNumbers) {
  //       if (trackedImos.includes(imo)) {
  //         foundImos.push(imo);
  //       } else {
  //         notFoundImos.push(imo);
  //       }
  //     }
  
  //     // Remove duplicates from notFoundImos
  //     notFoundImos = [...new Set(notFoundImos)];
  
  //     // Process not found IMOs and add them as new tracked vessels
  //     for (const imo of notFoundImos) {
  //       try {
  //         // Fetch vessel details from Vessel collection
  //         const vesselData = await Vessel.findOne({ imoNumber: imo }).select(
  //           "SpireTransportType FLAG GrossTonnage deadWeight"
  //         );
  //         if (!vesselData) {
  //           const errorMessage = `Vessel with IMO ${imo} not found in vessel_master`;
  //           console.error(errorMessage);
  //           errorMessages.push(errorMessage);
  //           failureCount.push(imo);
  //           continue;
  //         }
          
  //         // Fetch AIS data
  //         const aisResponse = await axios.get("https://api.vtexplorer.com/vessels", {
  //           params: { userkey, imo, format: "json", sat: "1" },
  //         });
  //         const aisDataArray = aisResponse.data;
  //         if (!aisDataArray || aisDataArray.length === 0) {
  //           const errorMessage = `AIS data not found for IMO ${imo}`;
  //           console.error(errorMessage);
  //           errorMessages.push(errorMessage);
  //           failureCount.push(imo);
  //           continue;
  //         }
          
  //         // Add new TrackedVessel
  //         const currentTime = new Date();
  //         const aisData = aisDataArray[0].AIS;
  //         const newTrackedVessel = new TrackedVessel({
  //           IMO: imo,
  //           AIS: { ...aisData },
  //           SpireTransportType: vesselData.SpireTransportType,
  //           FLAG: vesselData.FLAG,
  //           GrossTonnage: vesselData.GrossTonnage,
  //           deadWeight: vesselData.deadWeight,
  //           trackingFlag: true,
  //           lastFetchTime: currentTime,
  //           GeofenceStatus: null,
  //           geofenceFlag: null,
  //           GeofenceInsideTime: null,
  //           AisPullGfType: null,
  //         });
  //         await newTrackedVessel.save();
  //         successCount.push(imo);
  //       } catch (error) {
  //         console.error(`Error processing IMO ${imo}:`, error.message);
  //         errorMessages.push(`Error processing IMO ${imo}: ${error.message}`);
  //         failureCount.push(imo);
  //       }
  //     }
  
  //     // Save the ops data
  //     const savedDocuments = [];

  //     for (const row of data) {
  //       // Check for existing CaseId

  //       // use this mandatorily
  //       const existingSale = await OpsRadar.findOne({ CaseId: row.CaseId });
  
  //       if (existingSale) {
         
  //         const oldDocument = new OpsRadarHistory(existingSale.toObject());
  //         await oldDocument.save();
  
  //         // Remove old document from SalesRadar
  //         await OpsRadar.deleteOne({ _id: existingSale._id });
  
          
  //       }
             
  //       // Save the new document to SalesRadar
  //       const newOps = new OpsRadar({
  //         loginUserId: loginUserId,
  //         AdminId: AdminId,
  //         OrgId: OrgId,

  //         IMO: row.IMO,
  //         CaseId: row.CaseId,
  //         Agent: row.Agent,
  //         AgentName: row.AgentName,
  //         Info1: row.Info1,
  //         ETA : row.ETA,


  //       });
  //       const savedOps = await newOps.save();
  //       savedDocuments.push(savedOps);
  
  //       // Add user tracking data
  //       const requestBody3 = { 
  //         loginUserId,
  //         email,
  //         IMO: row.IMO,
  //         AdminId,
  //         OrgId,
  //         AddedDate: new Date().toISOString(),
  //       };
  //       const newUserTrackedVessel = new TrackedVesselByUser(requestBody3);
  //       await newUserTrackedVessel.save();
  //       userTrackedData.push(newUserTrackedVessel);
  //     }
  
  //     // Response with details
  //     res.status(200).json({
  //       message: "Ops Data uploaded successfully",
  //       savedDocuments,
  //       foundImos,
  //       notFoundImos,
  //       successCount,
  //       failureCount,
  //       errorMessages,
  //       userTrackedData, // Include user tracking data in the response
  //     });
  //   } catch (error) {
  //     console.error('Error uploading ops data:', error);
  //     res.status(500).json({ error: 'Failed to upload data' });
  //   }
  
  // });


//  API to fetch polygon geofences

// Function to send an email
const sendSalesDataEmail = async (reportname, recipient, data) => {
  const { savedDocuments, foundImos, notFoundImos, successCount, failureCount, errorMessages, userTrackedData } = data;

  // Convert data into readable HTML format
  const formatList = (list) => (list.length ? `<ul>${list.map(item => `<li>${item}</li>`).join('')}</ul>` : 'None');

  const htmlContent = `
      <h2>${reportname} Upload Report</h2>
      <p><strong>Saved Documents:</strong>  ${savedDocuments.length} </p>
      <p><strong>Found IMOs (already which are being tracked):</strong> ${formatList(foundImos)}</p>
      <p><strong>Not Found IMOs (New Vessels):</strong> ${formatList(notFoundImos)}</p>
      <p><strong>Successful Additions:</strong> ${formatList(successCount)}</p>
      <p><strong>Failed Additions:</strong> ${formatList(failureCount)}</p>
      <p><strong>Error Messages:</strong> ${formatList(errorMessages)}</p>
      <p><strong>User Tracked Data:</strong> ${formatList(userTrackedData.map(data => `User: ${data.loginUserId}, IMO: ${data.IMO}`))}</p>
  `;

  const mailOptions = {
      from: emailUser,
      bcc:[ recipient,'udhaykirank@adyapragnya.com'] ,
      subject: `${reportname} Data Upload Report`,
      html: htmlContent,
  };

  const transporter = nodemailer.createTransport({

    service: 'gmail', // or another email service provider
    auth: {
        user: emailUser,
        pass: emailPass,
    }
    });

  try {

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};


// API to fetch IMO numbers for given vessel names
app.post("/api/match-imo", async (req, res) => {
  try {
    const { vesselNames } = req.body; // Receive vessel names array

    if (!Array.isArray(vesselNames) || vesselNames.length === 0) {
      return res.status(400).json({ message: "Invalid vessel names array" });
    }

    // Fetch IMO numbers for matching transportName (case-insensitive)
    const vessels = await Vessel.find({ transportName: { $in: vesselNames } });

    // Create a mapping of vessel name -> IMO number
    let imoMapping = {};
    vessels.forEach((vessel) => {
      imoMapping[vessel.transportName] = vessel.imoNumber;
    });

    res.json({ imoMapping });
  } catch (error) {
    console.error("Error fetching IMO numbers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post("/api/upload-ops-data-bulk", async (req, res) => {
  try {
    const data = req.body; // Get the ops data from the request
    const imoNumbers = data.map(row => row.IMO); // Extract IMO numbers from the data
    const foundImos = [];
    let notFoundImos = [];
    const errorMessages = [];
    const successCount = [];
    const failureCount = [];
    const userTrackedData = []; // Array to store user-tracked vessel data
    
    // Extract user details from the first row (assuming all rows have the same user context)
    const { loginUserId, email, AdminId, OrgId } = data[0]; 
    
    // Check which IMOs exist in the TrackedVessel collection
    const trackedVessels = await TrackedVessel.find({ IMO: { $in: imoNumbers } }).select('IMO');
    const trackedImos = trackedVessels.map(vessel => vessel.IMO);
    
    // Separate found and not found IMOs
    for (const imo of imoNumbers) {
      if (trackedImos.includes(imo)) {
        foundImos.push(imo);
      } else {
        notFoundImos.push(imo);
      }
    }

    // Remove duplicates from notFoundImos
    notFoundImos = [...new Set(notFoundImos)];

    // Process not found IMOs and add them as new tracked vessels
    await Promise.all(
      notFoundImos.map(async (imo) => {
      try {
        // Fetch vessel details from Vessel collection
        const vesselData = await Vessel.findOne({ imoNumber: imo }).select(
          "SpireTransportType FLAG GrossTonnage deadWeight"
        );
        if (!vesselData) {
          // const errorMessage = `Vessel with IMO ${imo} not found in vessel_master`;
          // console.error(errorMessage);
          // errorMessages.push(errorMessage);
          // failureCount.push(imo);
          // continue;

          throw new Error(`Vessel master not found for - ${imo}`);
        }
        
        // Fetch AIS data
        const aisResponse = await axios.get("https://api.vtexplorer.com/vessels", {
          params: { userkey, imo, format: "json", sat: "1" },
        });
        
        if (!aisResponse.data || aisResponse.data.length === 0) {
          // const errorMessage = `AIS data not found for IMO ${imo}`;
          // console.error(errorMessage);
          // errorMessages.push(errorMessage);
          // failureCount.push(imo);
          // continue;

          throw new Error(`AIS data not found for - ${imo}`);
        }
        
        // Add new TrackedVessel
        const currentTime = new Date();
        const aisData = aisResponse.data[0]?.AIS;
        const newTrackedVessel = new TrackedVessel({
          IMO: imo,
          AIS: { ...aisData },
          SpireTransportType: vesselData.SpireTransportType,
          FLAG: vesselData.FLAG,
          GrossTonnage: vesselData.GrossTonnage,
          deadWeight: vesselData.deadWeight,
          trackingFlag: true,
          lastFetchTime: currentTime,
          GeofenceStatus: null,
          geofenceFlag: null,
          GeofenceInsideTime: null,
          AisPullGfType: null,
        });
        await newTrackedVessel.save();
        successCount.push(imo);
      } catch (error) {
        console.error(error.message);
        errorMessages.push(error.message);
        failureCount.push(imo);
        return;
      }
    })
  );
    


  const isFirstChunk = Number(req.headers['chunk-index']) === 0; 
  let existingOpsIMOS = []; // Declare outside so it's accessible

  if (isFirstChunk) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of the day
  
       // Move all old ops data of this loginUserId to OpsRadarHistory before adding new data
    const existingOps = await OpsRadar.find({ loginUserId, Flag:"bulk", createdAt: { $lt: today }   });
    existingOpsIMOS = [...new Set(existingOps.map(op => op.IMO))];
    

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (existingOps.length) {
        await OpsRadarHistory.insertMany(existingOps, { session });
        await OpsRadar.deleteMany({ loginUserId, Flag:"bulk" }, { session });
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Failed to move OpsRadar data to history:", error);
      throw new Error("Database transaction failed."); // Ensure failure stops further execution
    } finally {
      session.endSession();
    }
     }
    

    // Save the new ops data
    const savedDocuments = [];
    for (const row of data) {
      try {
     
        const newOps = new OpsRadar({ Flag: "bulk" , ...row });
        const savedOps = await newOps.save();
        savedDocuments.push(savedOps);

        if (!row.IMO) {
          console.log(`Invalid IMO value- ${row.IMO}. The document will not be added in tracked vessel by user.`);
        } else {
          // Add user tracking data
          const requestBody3 = { 
            loginUserId,
            email,
            IMO: row.IMO,
            AdminId,
            OrgId,
            AddedDate: new Date().toISOString(),
          };

          // Check if a document with the same loginUserId and IMO already exists
          const existingDocument = await TrackedVesselByUser.findOne({
            loginUserId: requestBody3.loginUserId,
            IMO: requestBody3.IMO
          });

          if (!existingDocument) {
            // If no document exists, create and save the new user tracked vessel data
            const newUserTrackedVessel = new TrackedVesselByUser(requestBody3);
            await newUserTrackedVessel.save();
            userTrackedData.push(newUserTrackedVessel);
          } 
        }

      } catch (error) {
        console.error('Error saving Ops data:', error);
        res.status(500).json({ error: 'Failed to upload data' });
        return;
      }
    }


    // const vesselImosTvbu = await TrackedVesselByUser.find({ loginUserId  });
    // const UniqueImos = [...new Set(vesselImosTvbu.map(doc => doc.IMO))];

       // Delete from TrackedVesselByUser and TrackedVessel if no users left tracking the vessel
       for (const imo of existingOpsIMOS) {
        const opsMatch = await OpsRadar.findOne({ loginUserId, IMO: imo });
        const salesMatch = await SalesRadar.findOne({ loginUserId, IMO: imo });
        // const salesISM = await SalesISM.findOne({ OrgId, IMO: imo})

        if (!opsMatch && !salesMatch) {
          await TrackedVesselByUser.deleteMany({ loginUserId, IMO: imo });
          
          const remainingTracked = await TrackedVesselByUser.findOne({ IMO: imo });
          if (!remainingTracked) {
            await TrackedVessel.deleteOne({ IMO: imo });
            console.log(`tracked vessel deleted ${imo}`);

          }
        }
      }

      
    // Call this function after processing the sales data
sendSalesDataEmail("OPS", email, {
  savedDocuments,
  foundImos,
  notFoundImos,
  successCount,
  failureCount,
  errorMessages,
  userTrackedData
});


    // Response with details
    res.status(200).json({
      message: "Ops Data uploaded successfully",
      savedDocuments,
      foundImos,
      notFoundImos,
      successCount,
      failureCount,
      errorMessages,
      userTrackedData, // Include user tracking data in the response
    });
  } catch (error) {
    console.error('Error uploading ops data:', error);
    res.status(500).json({ error: 'Failed to upload data' });
  }
});

 
 
 app.get('/api/get-uploaded-ops-data', async (req, res) => {

  try {
    // const { role, userId } = req.query; // Extract role and userId from query parameters

    // if (!role || !userId) {
    //   return res.status(400).json({ error: 'Missing role or userId' });
    // }
    
    const OpsRadars = await OpsRadar.find();



      // const extractOrgPart = (value) => {

    //   let orgId = value.includes('_') ? value.split('_')[1] : value.split('_')[0];
      
    //   return orgId;
    // };
    
    // const filteredOpsData = opsData.filter((entry) => entry.OrgId === extractOrgPart(id));


    res.json(OpsRadars);
  } catch (error) {
    console.error('Error fetching ops data:', error);
    res.status(500).json({ error: 'Failed to fetch ops data' });
  }
});
 


 
app.post('/api/upload-sales-data', async (req, res) => {
  try {
    const data = req.body; // Get the sales data from the request
    const imoNumbers = data.map(row => row.IMO); // Extract IMO numbers from the data
    const foundImos = [];
    let notFoundImos = [];
    const errorMessages = [];
    const successCount = [];
    const failureCount = [];
    const userTrackedData = []; // Array to store user-tracked vessel data
    
    // Extract user details from the first row (assuming all rows have the same user context)
    const { loginUserId, email, AdminId, OrgId } = data[0]; 
   

    // Check which IMOs exist in the TrackedVessel collection
    const trackedVessels = await TrackedVessel.find({ IMO: { $in: imoNumbers } }).select('IMO');
    const trackedImos = trackedVessels.map(vessel => vessel.IMO);
    
    // Separate found and not found IMOs
    for (const imo of imoNumbers) {
      if (trackedImos.includes(imo)) {
        foundImos.push(imo);
      } else {
        notFoundImos.push(imo);
      }
    }

    // Remove duplicates from notFoundImos
    notFoundImos = [...new Set(notFoundImos)];

  // Process not found IMOs and add them as new tracked vessels
  await Promise.all(
    notFoundImos.map(async (imo) => {
      try {
        // Fetch vessel details from Vessel collection
        const vesselData = await Vessel.findOne({ imoNumber: imo }).select(
          "SpireTransportType FLAG GrossTonnage deadWeight"
        );
        if (!vesselData) {
          throw new Error(`Vessel master not found for - ${imo}`);

        }
        
        // Fetch AIS data
        const aisResponse = await axios.get("https://api.vtexplorer.com/vessels", {
          params: { userkey, imo, format: "json", sat: "1" },
        });
    
        if (!aisResponse.data || aisResponse.data.length === 0) {
    
          throw new Error(`AIS data not found for - ${imo}`);
        }
        
        // Add new TrackedVessel
        const currentTime = new Date();
        const aisData = aisResponse.data[0]?.AIS;
        const newTrackedVessel = new TrackedVessel({
          IMO: imo,
          AIS: { ...aisData },
          SpireTransportType: vesselData.SpireTransportType,
          FLAG: vesselData.FLAG,
          GrossTonnage: vesselData.GrossTonnage,
          deadWeight: vesselData.deadWeight,
          trackingFlag: true,
          lastFetchTime: currentTime,
          GeofenceStatus: null,
          geofenceFlag: null,
          GeofenceInsideTime: null,
          AisPullGfType: null,
        });
        await newTrackedVessel.save();
        successCount.push(imo);
      } catch (error) {
        console.error(error.message);
        errorMessages.push(error.message);
        failureCount.push(imo);
        return;
      }
    })
  );

  const isFirstChunk = Number(req.headers['chunk-index']) === 0; 
  const isLastChunk = req.headers['is-last-chunk'] === 'true';

  let existingSalesIMOS = []; // Declare outside so it's accessible

  if (isFirstChunk) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of the day
  
       // Move all old ops data of this loginUserId to OpsRadarHistory before adding new data
    const existingSales = await SalesRadar.find({ loginUserId, Flag:"bulk", createdAt: { $lt: today }   });
    existingSalesIMOS = [...new Set(existingSales.map(op => op.IMO))];
    
  
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (existingSales.length) {
        await SalesRadarHistory.insertMany(existingSales, { session });
        await SalesRadar.deleteMany({ loginUserId, Flag:"bulk", createdAt: { $lt: today }  }, { session });
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Failed to move Sales Radar data to history:", error);
      throw new Error("Database transaction failed."); // Ensure failure stops further execution
    } finally {
      session.endSession();
    }
  }



   // Save the sales data
   const savedDocuments = [];
   for (const row of data) {

    try{

      const newSale = new SalesRadar({ Flag: "bulk" , ...row });


      const savedSale = await newSale.save();
      savedDocuments.push(savedSale);

// Check if row.IMO is null, 0, undefined, or empty
if (!row.IMO) {
  console.log(`Invalid IMO value- ${row.IMO}. The document will not be added in tracked vessel by user.`);
} else {
  const requestBody2 = { 
    loginUserId,
    email,
    IMO: row.IMO,
    AdminId,
    OrgId,
    AddedDate: new Date().toISOString(),
  };

  // Check if the combination of loginUserId and IMO already exists in the database
  const existingTrackedVessel = await TrackedVesselByUser.findOne({
    loginUserId: loginUserId,
    IMO: row.IMO
  });

  if (!existingTrackedVessel) {
    // If not found, create and save the new tracked vessel record
    const newUserTrackedVessel = new TrackedVesselByUser(requestBody2);
    await newUserTrackedVessel.save();
    userTrackedData.push(newUserTrackedVessel);
  } 
}

} catch (error) {
  console.error('Error saving sales data:', error);
  res.status(500).json({ error: 'Failed to upload data' });
  return;
}
  }

  
    // 🚀 Perform deletion logic **only on the last chunk**
    if (isLastChunk) {
      console.log("Processing last chunk, performing deletion checks...");
  const vesselImosTvbu = await TrackedVesselByUser.find({ loginUserId  });
  const UniqueImos = [...new Set(vesselImosTvbu.map(doc => doc.IMO))];

     // Delete from TrackedVesselByUser and TrackedVessel if no users left tracking the vessel
     for (const imo of UniqueImos) {
      const opsMatch = await OpsRadar.findOne({ loginUserId, IMO: imo });
      const salesMatch = await SalesRadar.findOne({ loginUserId, IMO: imo });
      const salesISM = await SalesISM.findOne({ OrgId, IMO: imo})
      
      if (!opsMatch && !salesMatch && !salesISM) {
        await TrackedVesselByUser.deleteMany({ loginUserId, IMO: imo });
        
        const remainingTracked = await TrackedVesselByUser.findOne({ IMO: imo });
        if (!remainingTracked) {
          await TrackedVessel.deleteOne({ IMO: imo });
          console.log(`tracked vessel deleted ${imo}`);
        }
      }
    }
  }


    // Call this function after processing the sales data
    sendSalesDataEmail("Sales", email, {
      savedDocuments,
      foundImos,
      notFoundImos,
      successCount,
      failureCount,
      errorMessages,
      userTrackedData
    });
    
    
    // Response with details
    res.status(200).json({
      message: "Sales Data uploaded successfully",
      savedDocuments,
      foundImos,
      notFoundImos,
      successCount,
      failureCount,
      errorMessages,
      userTrackedData, // Include user tracking data in the response
    });
  } catch (error) {
    console.error('Error uploading sales data:', error);
    res.status(500).json({ error: 'Failed to upload data' });
  }
});


  
  
   
  //  app.post('/api/upload-sales-data', async (req, res) => {

  //   console.log("✅ Route handler reached!");
  //   console.log("Request body:", req.body);


  //   try {

  //     // 🚨 Check if request body is empty
  //   if (!req.body || !Array.isArray(req.body)) {
  //     return res.status(400).json({ error: "Invalid or empty request data" });
  //   }


  //     const data = req.body; // Get the sales data from the request
  //     const imoNumbers = data.map(row => row.IMO); // Extract IMO numbers from data
  //     const foundImos = [];
  //     let notFoundImos = [];
  //     const errorMessages = [];
  //     const successCount = [];
  //     const failureCount = [];
  //     const userTrackedData = [];
  //     const savedDocuments = [];
  
  //     // Extract user details from the first row
  //     const { loginUserId, email, AdminId, OrgId } = data[0]; 
  
  //     // Find existing tracked vessels in bulk
  //     const trackedVessels = await TrackedVessel.find({ IMO: { $in: imoNumbers } }).select('IMO');
  //     const trackedImos = new Set(trackedVessels.map(v => v.IMO));
  
  //     // Separate found and not found IMOs
  //     imoNumbers.forEach(imo => {
  //       if (trackedImos.has(imo)) {
  //         foundImos.push(imo);
  //       } else {
  //         notFoundImos.push(imo);
  //       }
  //     });
  
  //     // Remove duplicates from notFoundImos
  //     notFoundImos = [...new Set(notFoundImos)];
  
  //     // Process not found IMOs and add them as new tracked vessels
  //     const vesselDataMap = await Vessel.find({ imoNumber: { $in: notFoundImos } })
  //       .select("imoNumber SpireTransportType FLAG GrossTonnage deadWeight")
  //       .lean();
  
  //     const vesselMap = new Map(vesselDataMap.map(v => [v.imoNumber, v]));
  
  //     const newTrackedVessels = [];
  //     const apiRequests = notFoundImos.map(async (imo) => {
  //       try {
  //         if (!vesselMap.has(imo)) {
  //           throw new Error(`Vessel master not found for - ${imo}`);
  //         }
  
  //         // Fetch AIS data
  //         const aisResponse = await axios.get("https://api.vtexplorer.com/vessels", {
  //           params: { userkey, imo, format: "json", sat: "1" },
  //         });
  
  //         if (!aisResponse.data || aisResponse.data.length === 0) {
  //           throw new Error(`AIS data not found for - ${imo}`);
  //         }
  
  //         // Create new tracked vessel
  //         const vesselData = vesselMap.get(imo);
  //         const newTrackedVessel = {
  //           IMO: imo,
  //           AIS: aisResponse.data[0]?.AIS,
  //           SpireTransportType: vesselData.SpireTransportType,
  //           FLAG: vesselData.FLAG,
  //           GrossTonnage: vesselData.GrossTonnage,
  //           deadWeight: vesselData.deadWeight,
  //           trackingFlag: true,
  //           lastFetchTime: new Date(),
  //           GeofenceStatus: null,
  //           geofenceFlag: null,
  //           GeofenceInsideTime: null,
  //           AisPullGfType: null,
  //         };
  
  //         newTrackedVessels.push(newTrackedVessel);
  //         successCount.push(imo);
  //       } catch (error) {
  //         console.error(error.message);
  //         errorMessages.push(error.message);
  //         failureCount.push(imo);
  //       }
  //     });
  
  //     await Promise.allSettled(apiRequests);
  
  //     if (newTrackedVessels.length > 0) {
  //       await TrackedVessel.insertMany(newTrackedVessels);
  //     }
  
  //     // Move existing sales data to history before adding new data
  //     const session = await mongoose.startSession();
  //     session.startTransaction();
  //     try {
  //       const existingSales = await SalesRadar.find({ loginUserId, Flag: "bulk" });
  //       if (existingSales.length) {
  //         await SalesRadarHistory.insertMany(existingSales, { session });
  //         await SalesRadar.deleteMany({ loginUserId, Flag: "bulk" }, { session });
  //       }
  //       await session.commitTransaction();
  //     } catch (error) {
  //       await session.abortTransaction();
  //       console.error("Failed to move Sales Radar data to history:", error);
  //       throw new Error("Database transaction failed.");
  //     } finally {
  //       session.endSession();
  //     }
  
  //     // Save the new sales data
  //     const salesDocuments = data.map(row => ({ Flag: "bulk", ...row }));
  //     const insertedSales = await SalesRadar.insertMany(salesDocuments);
  //     savedDocuments.push(...insertedSales);
  
  //     // Track vessels by user
  //     const existingUserTracked = await TrackedVesselByUser.find({
  //       loginUserId,
  //       IMO: { $in: imoNumbers },
  //     }).select("IMO").lean();
  
  //     const existingUserTrackedImos = new Set(existingUserTracked.map(v => v.IMO));
  
  //     const newUserTrackedVessels = data
  //       .filter(row => row.IMO && !existingUserTrackedImos.has(row.IMO))
  //       .map(row => ({
  //         loginUserId,
  //         email,
  //         IMO: row.IMO,
  //         AdminId,
  //         OrgId,
  //         AddedDate: new Date().toISOString(),
  //       }));
  
  //     if (newUserTrackedVessels.length > 0) {
  //       const insertedUserTracked = await TrackedVesselByUser.insertMany(newUserTrackedVessels);
  //       userTrackedData.push(...insertedUserTracked);
  //     }
  
  //     // Cleanup: Delete from TrackedVesselByUser and TrackedVessel if no users left tracking
  //     const existingSalesIMOs = new Set(existingSales.map(op => op.IMO));
  
  //     for (const imo of existingSalesIMOs) {
  //       const opsMatch = await OpsRadar.findOne({ loginUserId, IMO: imo });
  //       const salesMatch = await SalesRadar.findOne({ loginUserId, IMO: imo });
  
  //       if (!opsMatch && !salesMatch) {
  //         await TrackedVesselByUser.deleteMany({ loginUserId, IMO: imo });
  
  //         const remainingTracked = await TrackedVesselByUser.findOne({ IMO: imo });
  //         if (!remainingTracked) {
  //           await TrackedVessel.deleteOne({ IMO: imo });
  //         }
  //       }
  //     }
  
  //     // Send email notification
  //     sendSalesDataEmail('udhaykirank@adyapragnya.com', {
  //       savedDocuments,
  //       foundImos,
  //       notFoundImos,
  //       successCount,
  //       failureCount,
  //       errorMessages,
  //       userTrackedData
  //     });
  
  //     // Send response
  //     res.status(200).json({
  //       message: "Sales Data uploaded successfully",
  //       savedDocuments,
  //       foundImos,
  //       notFoundImos,
  //       successCount,
  //       failureCount,
  //       errorMessages,
  //       userTrackedData
  //     });
  //   } catch (error) {
  //     console.error('Error uploading sales data:', error);
  //     res.status(500).json({ error: 'Failed to upload data' });
  //   }
  // });
  
   
   
   app.get('/api/get-upload-sales-data', async (req, res) => {
    try {
      const SalesRadars = await SalesRadar.find();
      res.json(SalesRadars);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      res.status(500).json({ error: 'Failed to fetch sales data' });
    }
  });

  app.post('/api/send-email', (req, res) => {
    console.log("Received request!");
  
    const { vessels } = req.body; // Expecting an array of vessels
    
    if (!Array.isArray(vessels) || vessels.length === 0) {
      return res.status(400).send('No vessels data provided');
    }
  
    // Format the vessel details
    const vesselDetails = vessels.map(vessel => {
      return `Vessel: ${vessel.vesselName}, Status: ${vessel.status}, Geofence: ${vessel.geofence}`;
    }).join('\n');
  
    // Mail options setup
    const mailOptions = {
      from:  emailUser, // Use the sender email from env variable
      bcc: 'hemanthsrinivas707@gmail.com', // Ensure this is the recipient's email
      subject: 'Vessel Status Update: Inside Vessels',
      text: `The following vessels are currently Inside:\n\n${vesselDetails}`,
    };
  
    const transporter = nodemailer.createTransport({
  
      service: 'gmail', // or another email service provider
      auth: {
          user: emailUser,
          pass: emailPass,
      }
  });
    // Sending the email using the transporter
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email: ' + error.toString());
      }
      res.status(200).send('Email sent successfully: ' + info.response);
    });
  });
 


// Route to fetch specific fields from vesselstrackeds collection
app.get('/api/get-tracked-vessels', async (req, res) => {

    try {
     
        const fields = {
            IMO:1,
            AIS: 1,
            SpireTransportType: 1,
            FLAG: 1,
            GrossTonnage: 1,
            deadWeight: 1,
            trackingFlag :1,
            GeofenceStatus:1,
            geofenceFlag:1,
            GeofenceInsideTime:1,
            AisPullGfType:1,
        };

        // Fetch vessels with only the specified fields
        const trackedVessels = await TrackedVessel.find({}, fields).exec();
        
        res.json(trackedVessels);
    } catch (error) {
        console.error('Error fetching tracked vessels:', error);
        res.status(500).json({ error: 'Error fetching tracked vessels' });
    }
});

app.get('/api/get-tracked-vessels-emission', async (req, res) => {
  try {
    // Fields to return only the specified values from the database
    const fields = {
      IMO: 1,                   // imoNumber: IMO
      "AIS.NAME": 1,            // transportName: AIS.NAME
      SpireTransportType: 1,    // transportCategory: SpireTransportType
      "SpireTransportType": 1,  // transportSubCategory: SpireTransportType
      deadWeight: 1,            // buildYear: deadWeight
    };

    // Fetch vessels with only the specified fields (projection)
    const trackedVessels = await TrackedVessel.find({}, fields).exec();
    
    // Map the results to return the desired values
    const result = trackedVessels.map(vessel => ({
      imoNumber: vessel.IMO,                           // IMO as imoNumber
      transportName: vessel.AIS?.NAME || '',            // AIS.NAME as transportName
      transportCategory: vessel.SpireTransportType,    // SpireTransportType as transportCategory
      transportSubCategory: vessel.SpireTransportType, // SpireTransportType as transportSubCategory
      SpireTransportType: vessel.SpireTransportType,   // SpireTransportType as SpireTransportType
      buildYear: vessel.deadWeight                     // deadWeight as buildYear
    }));

    // Send the result to the client
    res.json(result);
  } catch (error) {
    console.error('Error fetching tracked vessels:', error);
    res.status(500).json({ error: 'Error fetching tracked vessels' });
  }
});




// app.patch('/api/delete-vessel', async (req, res) => {
//   const { imoNumbers, loginUserId } = req.body; // Destructure imoNumbers and loginUserId from the request body
//   // console.log(req.body);

//   try {
//       if (!Array.isArray(imoNumbers) || imoNumbers.length === 0) {
//           return res.status(400).json({ message: 'Invalid or missing IMO numbers' });
//       }

//       const results = [];

//       // Iterate through each IMO number to handle deletion logic
//       for (let imo of imoNumbers) {
//           // First, check the number of documents in TrackedVesselByUser with the given IMO
//           const vesselTrackingCount = await TrackedVesselByUser.countDocuments({ 'IMO': imo });
//           const vesselOpsCount = await OpsRadar.countDocuments({ 'IMO': imo, 'loginUserId': loginUserId });
//           const vesselSalesCount = await SalesRadar.countDocuments({ 'IMO': imo, 'loginUserId': loginUserId });

//           // If only one user is tracking this vessel, delete from both collections

//           if(vesselOpsCount > 0 || vesselSalesCount > 0){

//             if(vesselOpsCount > 0){
//             return res.status(400).json({ message: `Vessel with IMO ${imo} is being tracked in OPS` });
//             }

//             if(vesselSalesCount > 0){
//             return res.status(400).json({ message: `Vessel with IMO ${imo} is being tracked in Sales` });
//             }


//           }
//           else if (vesselTrackingCount === 1) {
//               // Delete the vessel from both collections
//               const deletedVessel = await TrackedVessel.deleteOne({ 'IMO': imo });
//               const deletedFromUser = await TrackedVesselByUser.deleteOne({ 'IMO': imo, 'loginUserId': loginUserId });

//               if (deletedVessel.deletedCount === 0) {
//                   return res.status(404).json({ message: `Vessel with IMO ${imo} not found in TrackedVessel` });
//               }
//               if (deletedFromUser.deletedCount === 0) {
//                   return res.status(404).json({ message: `Vessel with IMO ${imo} not found in TrackedVesselByUser` });
//               }

//               // Return successful response
//               res.status(200).json({
//                   message: `Vessel with IMO ${imo} deleted successfully from both collections`,
//                   deletedCount: 1
//               });

//           } else if (vesselTrackingCount > 1) {
//               // If more than one user is tracking this vessel, only delete from TrackedVesselByUser
//               const deletedFromUser = await TrackedVesselByUser.deleteMany({ 'IMO': imo, 'loginUserId': loginUserId });

//               if (deletedFromUser.deletedCount === 0) {
//                   return res.status(404).json({ message: `Vessel with IMO ${imo} not found for the current user` });
//               }

//               res.status(200).json({
//                   message: `Vessel with IMO ${imo} deleted from TrackedVesselByUser only`,
//                   deletedCount: 1
//               });
//           } else {
//               return res.status(404).json({ message: `No vessels found with IMO ${imo} in TrackedVesselByUser` });
//           }
//       }
//   } catch (error) {
//       console.error("Error deleting vessel:", error);
//       res.status(500).json({ message: 'Server error' });
//   }
// });




// app.patch('/api/delete-vessel', async (req, res) => {
//   const { imoNumbers, loginUserId, role } = req.body; // Destructure imoNumbers and loginUserId from the request body
//   const orgId = loginUserId.includes('_') ? loginUserId.split('_')[1] : loginUserId.split('_')[0];

//   try {
//     if (!Array.isArray(imoNumbers) || imoNumbers.length === 0) {
//       return res.status(400).json({ message: 'Invalid or missing IMO numbers' });
//     }

//     const results = [];

//     for (let imo of imoNumbers) {

//       // First, check the number of documents in TrackedVesselByUser with the given IMO
//       const vesselOpsCount = await OpsRadar.countDocuments({ 'IMO': imo, 'loginUserId': loginUserId });
//       const vesselSalesCount = await SalesRadar.countDocuments({ 'IMO': imo, 'loginUserId': loginUserId });

//       if (vesselOpsCount > 0) {
//         await OpsRadar.deleteMany({ 'IMO': imo, 'loginUserId': loginUserId });
//       }

//       if (vesselSalesCount > 0) {
//        await SalesRadar.deleteMany({ 'IMO': imo, 'loginUserId': loginUserId });
//       }

//       // Check if the vessel is tracked by only one user
//       const vesselTrackingCount = await TrackedVesselByUser.countDocuments({ 'IMO': imo });

//       if (vesselTrackingCount === 1) {
//         const deletedVessel = await TrackedVessel.deleteOne({ 'IMO': imo });
//         const deletedFromUser = await TrackedVesselByUser.deleteOne({ 'IMO': imo, 'loginUserId': loginUserId });

//         if (deletedVessel.deletedCount === 0 || deletedFromUser.deletedCount === 0) {
//           results.push({ imo, message: `Vessel with IMO ${imo} could not be deleted`, status: 'error' });
//         } else {
//           results.push({ imo, message: `Vessel with IMO ${imo} deleted successfully`, status: 'success' });
//         }

//       } else if (vesselTrackingCount > 1) {
//         // it also deletes all duplicates
//         const deletedFromUser = await TrackedVesselByUser.deleteMany({ 'IMO': imo, 'loginUserId': loginUserId });
//         // after deleting above, check again if 0 then delete in trackedvessels
//         if(vesselTrackingCount === 0) {
//           await TrackedVessel.deleteOne({ 'IMO': imo });
//         }
        
//         if (deletedFromUser.deletedCount === 0) {
//           results.push({ imo, message: `Vessel with IMO ${imo} not found for the current user`, status: 'error' });
//         } else {
//           results.push({ imo, message: `Vessel with IMO ${imo} deleted from TrackedVesselByUser only`, status: 'success' });
//         }

//       } else {
//         results.push({ imo, message: `No vessels found with IMO ${imo} in TrackedVesselByUser`, status: 'error' });
//       }
//     }

//     // Return all results at the end
//     res.status(200).json({ results });

//   } catch (error) {
//     console.error("Error deleting vessel:", error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// 
async function getRecipients({ role, loginUserId, deleteScope, affectedUserIds }) {
  const recipients = new Set();
  const self = await LoginUsers.findOne({ loginUserId });
  if (self?.email) recipients.add(self.email);

  if (deleteScope === 'all') {
    if (role === 'hyla admin') {
      const affectedUsers = await LoginUsers.find({ loginUserId: { $in: affectedUserIds } });

      const orgRefs = new Set();
      const guestEmails = [];

      console.log(affectedUsers);
      affectedUsers.forEach(user => {
        if (user.orgRef) {
          orgRefs.add(user.orgRef);
        } else if (user.email) {
          guestEmails.push(user.email);
        }
      });


      // Add all users in each affected org
      for (const orgRef of orgRefs) {
        const orgUsers = await LoginUsers.find({ orgRef });
        console.log('orgUser',orgUsers);
        orgUsers.forEach(u => {
          if (u.email) recipients.add(u.email);
        });
      }
      

      // Add guests separately
      guestEmails.forEach(email => recipients.add(email));


    } else if (role === 'organization admin' || role === 'organizational user') {
      if (self?.orgRef) {
        const orgUsers = await LoginUsers.find({ orgRef: self.orgRef });
        orgUsers.forEach(u => {
          if (u.email) recipients.add(u.email);
        });
      }
    }
  }
        console.log('recipients1',recipients);

  return Array.from(recipients);
}


function generateDeletionEmail({
  recipientName,
  deleterName,
  deletedImos,
  failedImos,
  isSelf,
  role,
  deleteScope,
  imoNameMap
}) {
  const getReasonText = (reason) => {
    switch (reason) {
      case 'notTrackedByUser': return 'Vessel was not tracked by you.';
      case 'notTrackedByOrg': return deleteScope === 'all' ? 'Vessel was not tracked by your organization.' : 'Vessel is not in your personal tracked list.';
      case 'deletionFailed': return 'Vessel could not be deleted due to an internal error.';
      default: return 'Unknown issue.';
    }
  };

  const formatVessel = (imo) => {
    const name = imoNameMap[imo];
    return name ? `<strong>${name}</strong> (IMO: ${imo})` : `<strong>IMO: ${imo}</strong>`;
  };

  const deletedList = deletedImos.map(e => `<li style="margin-bottom: 6px;">${formatVessel(e.imo)}</li>`).join('');
  const failedList = failedImos.map(e =>
    `<li style="margin-bottom: 6px;">
      ${formatVessel(e.imo)}<br/>
      <span style="color: #888; font-size: 13px;">${getReasonText(e.reason)}</span>
    </li>`
  ).join('');

  const headerText = isSelf
    ? `<p>Hi ${recipientName},</p><p>Here is the result of your vessel deletion request:</p>`
    : `<p>Hi ${recipientName},</p><p>Your tracked vessels were deleted by <strong>${deleterName}</strong>.</p>`;

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      ${headerText}
      ${
        deletedImos.length > 0
          ? `<div style="margin-top: 20px;"><p><strong>✅ Successfully Deleted:</strong></p><ul style="padding-left: 20px;">${deletedList}</ul></div>`
          : `<p><strong>No vessels were successfully deleted.</strong></p>`
      }
      ${
        isSelf && failedImos.length > 0
          ? `<div style="margin-top: 20px;"><p><strong>⚠️ Failed to Delete:</strong></p><ul style="padding-left: 20px;">${failedList}</ul></div>`
          : ''
      }
      <p style="margin-top: 30px;">Regards,<br/>Hylapps Team</p>
    </div>
  `;
}


async function fetchTrackedVesselsForImos({ imoNumbers, role, deleteScope, orgId, loginUserId }) {
  // Fetch all tracked vessels for the IMOs with one query or minimal queries
  let query = { IMO: { $in: imoNumbers } };

  if (role === 'hyla admin' && deleteScope === 'all') {
    // No extra filter
  } else if (['organization admin', 'organizational user'].includes(role) && deleteScope === 'all') {
    query.OrgId = orgId;
  } else {
    query.loginUserId = loginUserId;
  }

  const trackedVessels = await TrackedVesselByUser.find(query);
  return trackedVessels;
}

async function deleteTrackedVessels({ imoNumbers, trackedVessels, role, deleteScope, orgId, loginUserId }) {
  const successImos = [];
  const failedImos = [];
  const affectedUsersMap = {};
  const affectedOrgsMap = {}; // OrgId -> Set of IMO
  const affectedGuestsMap = {}; // guestEmail -> Set of IMO

  // Group tracked vessels by IMO for quick lookup
  const vesselsByImo = imoNumbers.reduce((acc, imo) => {
    acc[imo] = [];
    return acc;
  }, {});

  trackedVessels.forEach(tv => {
    if (vesselsByImo[tv.IMO]) vesselsByImo[tv.IMO].push(tv);
  });

  await Promise.all(imoNumbers.map(async (imo) => {
    const entries = vesselsByImo[imo] || [];

    if (entries.length === 0) {
      const reason = (['organization admin', 'organizational user'].includes(role) && deleteScope === 'all')
        ? 'notTrackedByOrg'
        : 'notTrackedByUser';

        console.warn(`[DELETE FAIL] IMO ${imo} - Reason: ${reason}`);
      failedImos.push({ imo, reason });
      return;
    }

    let deletionFilter;
    if (role === 'hyla admin' && deleteScope === 'all') {
      deletionFilter = { IMO: imo };
    } else if (['organization admin', 'organizational user'].includes(role) && deleteScope === 'all') {
      deletionFilter = { IMO: imo, OrgId: orgId };
    } else {
      deletionFilter = { IMO: imo, loginUserId };
    }

    const deleteResult = await TrackedVesselByUser.deleteMany(deletionFilter);

    if (deleteResult.deletedCount > 0) {
       console.log(`[DELETE SUCCESS] IMO ${imo} - Deleted ${deleteResult.deletedCount} entries`);

      successImos.push({ imo });

        entries.forEach(e => {
        affectedUsersMap[e.loginUserId] = affectedUsersMap[e.loginUserId] || [];
        affectedUsersMap[e.loginUserId].push(imo);

        if (e.OrgId) {
          if (!affectedOrgsMap[e.OrgId]) affectedOrgsMap[e.OrgId] = new Set();
          affectedOrgsMap[e.OrgId].add(imo);
        } else if (e.email) {
          if (!affectedGuestsMap[e.email]) affectedGuestsMap[e.email] = new Set();
          affectedGuestsMap[e.email].add(imo);
        }
      });



      // Remove vessel if no one tracks it anymore
      const stillTracked = await TrackedVesselByUser.countDocuments({ IMO: imo });
      if (stillTracked === 0) await TrackedVessel.deleteOne({ IMO: imo });

      if (stillTracked === 0) {
  console.log(`[CLEANUP] IMO ${imo} - No remaining trackers, TrackedVessel removed`);
}


      // Delete OpsRadar and SalesRadar in parallel
      await Promise.all(entries.map(e => 
        Promise.all([
          OpsRadar.deleteMany({ IMO: imo, loginUserId: e.loginUserId }),
          SalesRadar.deleteMany({ IMO: imo, loginUserId: e.loginUserId })
        ])
      ));
    } else {
      console.error(`[DELETE ERROR] IMO ${imo} - Delete attempted but no documents deleted`);
      failedImos.push({ imo, reason: 'deletionFailed' });
    }
  }));

  return { successImos, failedImos, affectedOrgsMap, affectedGuestsMap };
}

async function sendDeletionEmails({
  loginUserId, role, deleteScope,
  successImos, failedImos,
  affectedOrgsMap ,affectedGuestsMap , imoNameMap
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });

    
    if (deleteScope === 'self') {
      const selfUser = await LoginUsers.findOne({ loginUserId });
      if (selfUser?.email) {
        const html = generateDeletionEmail({
          recipientName: `${selfUser.firstName} ${selfUser.lastName}`,
          deleterName: '',
          deletedImos: successImos,
          failedImos,
          isSelf: true,
          role,
          deleteScope,
          imoNameMap
        });

        await transporter.sendMail({
          from: emailUser,
          to: selfUser.email,
          subject: 'Your vessel deletion results',
          html
        });
        console.log(`Email: ${emailUser}`);

        console.log(`Email sent to self: ${selfUser.email}`);

        console.log(`content: ${html}`);

      }
    }

    if (deleteScope === 'all') {
      const admin = await LoginUsers.findOne({ loginUserId });

      if (admin?.email) {
        const htmlSelf = generateDeletionEmail({
          recipientName: `${admin.firstName} ${admin.lastName}`,
          deleterName: '',
          deletedImos: successImos,
          failedImos,
          isSelf: true,
          role,
          deleteScope,
          imoNameMap
        });

        await transporter.sendMail({
          from: emailUser,
          to: admin.email,
          subject: 'Vessels deletion summary',
          html: htmlSelf
        });
        console.log(`Email sent to admin: ${admin.email}`);
      }


      for (const [orgId, imoSet] of Object.entries(affectedOrgsMap)) {
        const org = await Organization.findOne({ orgId }); // e.g., "ORG123"
  if (!org) {
    console.warn(`Organization not found for orgId: ${orgId}`);
    return [];
  }

  const orgUsers = await LoginUsers.find({ orgRef: org._id });

  for (const user of orgUsers) {
      if (user.loginUserId === loginUserId) continue; // ✅ avoid sending admin duplicate email
    const imos = Array.from(imoSet).map(imo => ({ imo }));

    const html = generateDeletionEmail({
      recipientName: `${user.firstName} ${user.lastName}`,
      deleterName: admin.email || 'an administrator',
      deletedImos: imos,
      failedImos: [],
      isSelf: false,
      role,
      deleteScope,
      imoNameMap
    });

    await transporter.sendMail({
      from: emailUser,
      to: user.email,
      subject: 'Your tracked vessel(s) were deleted',
      html
    });

    console.log(`📧 Email sent to: ${user.email}`);
console.log(`--- Email Content ---\n${imos}`);
  }
}

for (const [guestEmail, imoSet] of Object.entries(affectedGuestsMap)) {
  const imos = Array.from(imoSet).map(imo => ({ imo }));

  const html = generateDeletionEmail({
    recipientName: guestEmail, // No name, fallback to email
    deleterName: admin.email || 'an administrator',
    deletedImos: imos,
    failedImos: [],
    isSelf: false,
    role,
    deleteScope,
    imoNameMap
  });

  await transporter.sendMail({
    from: emailUser,
    to: guestEmail,
    subject: 'Your tracked vessel(s) were deleted',
    html
  });

  console.log(`📧 Email sent to: ${guestEmail}`);
console.log(`--- Email Content ---\n${imos}`);

}



    }
  } catch (err) {
    console.error('Email sending error:', err);
  }
}


app.patch('/api/delete-vessel', async (req, res) => {
 const { imoNumbers, loginUserId, role, deleteScope } = req.body;

  if (!Array.isArray(imoNumbers) || imoNumbers.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing IMO numbers' });
  }

  // Derive orgId from loginUserId (adjust if needed)
  const orgId = loginUserId.includes('_') ? loginUserId.split('_')[1] : loginUserId.split('_')[0];

  try {
    // Fetch all tracked vessels upfront
    const trackedVessels = await fetchTrackedVesselsForImos({ imoNumbers, role, deleteScope, orgId, loginUserId });

    // Delete vessels & related data in parallel & gather results
    const { successImos, failedImos, affectedOrgsMap, affectedGuestsMap } = await deleteTrackedVessels({
      imoNumbers, trackedVessels, role, deleteScope, orgId, loginUserId
    });

    // Prepare IMO->ShipName map
    const allImos = [...new Set([...successImos.map(e => e.imo), ...failedImos.map(e => e.imo)])];
    const vesselsInfo = await TrackedVessel.find({ IMO: { $in: allImos } });
    const imoNameMap = {};
    vesselsInfo.forEach(v => {
      imoNameMap[v.IMO] = v.SHIPNAME || '';
    });

 
   // Start async email sending, don't await
    sendDeletionEmails({ loginUserId, role, deleteScope, successImos, failedImos,   affectedOrgsMap, affectedGuestsMap,  imoNameMap });

    console.log('✅ Response sent to frontend. Email sending started.');
    return res.status(200).json({ successImos, failedImos });
   
   

  } catch (error) {
    console.error("Error deleting vessel:", error);
    return res.status(500).json({ message: 'Server error' });
  }
});



// Route to fetch vessels with search capability and pagination
app.get('/api/get-vessels', async (req, res) => {


    try {
        const searchQuery = req.query.search || "";
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Prepare the query for search
        const query = searchQuery ? {
            transportName: { $regex: searchQuery, $options: 'i' }
        } : {};

        // Fetch vessels with pagination
        const vessels = await Vessel.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        
        // Count total documents for pagination
        const total = await Vessel.countDocuments(query);
        
        res.json({
            total,
            vessels
        });
    } catch (error) {
        console.error('Error fetching vessels:', error);
        res.status(500).json({ error: 'Error fetching vessels' });
    }
});

// Route to fetch vessel data from an external API (if needed)
// app.get('/api/ais-data', async (req, res) => {
//     const { imo } = req.query; // Extract IMO from query parameters
   

//     try {
//         const response = await axios.get('https://api.vtexplorer.com/vessels', {
//             params: {
//                 userkey,
//                 imo,
//                 format: 'json',
//                 sat:'1'
//             }
//         });
//         res.json(response.data); // Send the external API response back as JSON
//     } catch (error) {
//         console.error('Error fetching vessel data from external API:', error);
//         res.status(500).send(error.toString());
//     }
// });






  // async function checkAndUpdateVesselData() {
  //     try {

  //         // Fetch the smallest sat0 and sat1a values across all documents
  //       const aisSatPullConfig = await AisSatPull.aggregate([
  //         {
  //             $group: {
  //                 _id: null,
  //                 minSat0: { $min: "$sat0" },  // Get the smallest sat0 value
  //                 minSat1a: { $min: "$sat1a" }, // Get the smallest sat1a value
  //                 minSat1b: { $min: "$sat1b" } 
  //               }
  //         }
  //     ]);




  //         if (!aisSatPullConfig) {
  //             console.error('Sat pull intervals not found.');
  //             return;
  //         }

  //         const { minSat0, minSat1a, minSat1b } = aisSatPullConfig[0]; // Extract min values for sat0 and sat1a
  
  
  //         const vessels = await TrackedVessel.find({trackingFlag: true});
  //         console.log(`Total vessels with trackingFlag true: ${vessels.length}`);
  //         const TerrestrialGeofences = await TerrestrialGeofence.find();
                                                   
  //         if (!TerrestrialGeofences || TerrestrialGeofences.length === 0) {
  //             console.error('No geofences found.');
  //             return;
  //         }
  
  //         let vesselsInGeofence = [];
  
  //         for (const vessel of vessels) {
  //             const { LATITUDE: vesselLat, LONGITUDE: vesselLng, NAME, IMO } = vessel.AIS;
  //             const currentTime = new Date();
  //             const vesselPoint = turf.point([vesselLng, vesselLat]);
  
  //             let isInsideAnyGeofence = false;
  //             let geofenceDetails = {};
  //             let interval, sat;
  
  //             for (const geofence of TerrestrialGeofences) {
  //                 const geofenceCoordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
  //                 if (geofenceCoordinates[0][0] !== geofenceCoordinates[geofenceCoordinates.length - 1][0] ||
  //                     geofenceCoordinates[0][1] !== geofenceCoordinates[geofenceCoordinates.length - 1][1]) {
  //                     geofenceCoordinates.push(geofenceCoordinates[0]);
  //                 }
  
  //                 const geofencePolygonTr = turf.polygon([geofenceCoordinates]);
  //                 const isInside = turf.booleanPointInPolygon(vesselPoint, geofencePolygonTr);
  
  //                 if (isInside) {
  //                     isInsideAnyGeofence = true;
  //                     geofenceDetails = {
  //                         geofenceName: geofence.geofenceName,
  //                         geofenceFlag: 'Inside',
  //                         entryTime: new Date().toISOString(),
  //                         exitTime: null,
  //                     };
  
  //                     vesselsInGeofence.push({ NAME, IMO, geofence: geofence.geofenceName });
                      

  //                      // Use the smallest sat0 and sat1a values based on geofence type
  //                   if ( geofence.geofenceType === 'inport') {
  //                     interval = minSat0;  // Use smallest sat0
  //                     sat = 0;
  //                 } else if (geofence.geofenceType === 'terrestrial' || geofence.geofenceType === 'boundary') {
  //                     interval = minSat1a;  // Use smallest sat1a
  //                     sat = 1;
  //                 }

  //                     if(geofence.geofenceType === 'terrestrial'){
  //                       await TrackedVessel.findOneAndUpdate({IMO:IMO},{AisPullGfType:"terrestrial"});
  //                     }
  //                     if(geofence.geofenceType === 'inport'){
  //                       await TrackedVessel.findOneAndUpdate({IMO:IMO},{AisPullGfType:"inport"});
  //                     }
  //                     if(geofence.geofenceType === 'boundary'){
  //                       await TrackedVessel.findOneAndUpdate({IMO:IMO},{AisPullGfType:"boundary"});
  //                     }
                         
  //                     // console.log(`"${geofence.geofenceName}" : inside, geofenceType: ${geofence.geofenceType}`);
  //                     break;
  //                 }
  //             }
  //             if (!isInsideAnyGeofence) {
  //                 interval = minSat1b;
  //                 sat = 1;
  //                 // console.log("No vessels inside any geofence");
  //             }
  //             const lastFetchTime = vessel.lastFetchTime ? new Date(vessel.lastFetchTime) : null;
  //             const timeElapsed = lastFetchTime ? currentTime - lastFetchTime : interval;
  
  //             if (!lastFetchTime || timeElapsed >= interval) {
  //                 console.log(`Fetching VTExplorer data for ${NAME} with interval ${interval}...`);
  
  //                 const response = await axios.get('https://api.vtexplorer.com/vessels', {
  //                   params: {
  //                       userkey,
  //                       imo: vessel.AIS.IMO,
  //                       format: 'json',
  //                       sat,
  //                   },
  //               });

  //               console.log("got ais data");

  //               const apiData = response.data[0]?.AIS;

  //               if (apiData && apiData.LATITUDE && apiData.LONGITUDE) {
  //                   if (apiData.LATITUDE !== vesselLat || apiData.LONGITUDE !== vesselLng) {
                                           
  //                       // updating location in tracked vessels                   
  //                       await axios.put(`${reactAPI}/api/updateVesselLocation/${apiData.IMO}`, {
  //                           MMSI: apiData.MMSI,
  //                           TIMESTAMP: apiData.TIMESTAMP,
  //                           LATITUDE: apiData.LATITUDE,
  //                           LONGITUDE: apiData.LONGITUDE,               
  //                           COURSE: apiData.COURSE,
  //                           SPEED: apiData.SPEED,
  //                           HEADING: apiData.HEADING,
  //                           NAVSTAT: apiData.NAVSTAT,
  //                           IMO: apiData.IMO,
  //                           CALLSIGN: apiData.CALLSIGN,
  //                           TYPE: apiData.TYPE,
  //                           A: apiData.A,
  //                           B: apiData.B,
  //                           C: apiData.C,
  //                           D: apiData.D,
  //                           DRAUGHT: apiData.DRAUGHT,
  //                           DESTINATION: apiData.DESTINATION,
  //                           LOCODE: apiData.LOCODE,
  //                           ETA_AIS: apiData.ETA_AIS,
  //                           ETA: apiData.ETA,
  //                           SRC: apiData.SRC,
  //                           ZONE: apiData.ZONE,
  //                           ECA: apiData.ECA,
  //                           DISTANCE_REMAINING: apiData.DISTANCE_REMAINING,
  //                           ETA_PREDICTED: apiData.ETA_PREDICTED,
  //                           lastFetchTime: currentTime,
  //                           geofenceDetails: isInsideAnyGeofence ? geofenceDetails : null,
  //                       });
  //                       console.log(`Vessel ${NAME} (IMO: ${IMO}) location updated.`);

  //                               // updating location in vessel buffer geofence
  //                               const vesselBufferExists = await VesselBufferGeofence.countDocuments({ IMO: apiData.IMO });
  //                               if (vesselBufferExists > 0) {
  //                                   await axios.put(`${reactAPI}/api/updateVesselBufferGeofence/${apiData.IMO}`, {
  //                                       NAME: NAME,
  //                                       TIMESTAMP: apiData.TIMESTAMP,
  //                                       LATITUDE: apiData.LATITUDE,
  //                                       LONGITUDE: apiData.LONGITUDE
  //                                   });
  //                                   console.log(`Updated Vessel Buffer Geofence for IMO: ${apiData.IMO}`);
  //                               }

  //                   } else {
  //                       await TrackedVessel.updateOne({ _id: vessel._id }, { lastFetchTime: currentTime });
  //                   }
  //                 } else {
  //                     console.error(`Invalid data for vessel ${NAME}`);
  //                 }
  //             } else {
  //                 // console.log(`Skipping vessel ${NAME} (IMO: ${IMO}) - waiting for next interval...`);
  //             }
  //         }
  
  //          // Send consolidated email if it's time (9 AM or 2 PM)
  //         const currentTime = new Date();
  //         const currentHour = currentTime.getHours();
          
  //          // Check if it's 9 AM or 2 PM
  //          if ((currentHour === 9 || currentHour === 14) && lastEmailSentAt !== currentHour && vesselsInGeofence.length > 0) {
  //           sendConsolidatedEmail(vesselsInGeofence);
              
  //              // Update the time when the email was sent
  //           lastEmailSentAt = currentHour;
  //         }
  //     } catch (error) {
  //         console.error('Error checking and updating vessel data:', error);
  //     } finally {
  //         setTimeout(checkAndUpdateVesselData, 1000 * 60 ); // Runs the function 
  //     }
  // }
  
 
  
//  async function sendConsolidatedEmail(vessels) {

//   if (!emailUser || !emailPass) {
//     console.error('Email credentials are not available. Cannot send email.');
//     return;
// }

//   const document = await EmailForAlerts.findOne();
//   const emailvs =document.consolidated_email;

//     const transporter = nodemailer.createTransport({
//         service: 'gmail', // or another email service provider
//         auth: {
//             user: emailUser,
//             pass: emailPass,
//         },
//     });

//     // Group vessels by geofence
//     const vesselsByGeofence = vessels.reduce((acc, vessel) => {
//         if (!acc[vessel.geofence]) {
//             acc[vessel.geofence] = [];
//         }
//         acc[vessel.geofence].push(vessel);
//         return acc;
//     }, {});




//     // Generate the HTML for each geofence's table
//     const emailBody = Object.keys(vesselsByGeofence)
//         .map(geofence => `
//             <div style="margin-bottom: 30px;">
//                 <h3 style="
//                     color: #0F67B1; 
//                     margin-bottom: 15px; 
//                     font-family: Arial, sans-serif;
//                     text-transform: uppercase;
//                     font-size: 16px;
//                 ">
//                     ${geofence}
//                 </h3>
//                 <table style="
//                     width: 100%; 
//                     border-collapse: separate; 
//                     border-spacing: 0; 
//                     font-family: Arial, sans-serif; 
//                     font-size: 14px; 
//                     text-align: left; 
//                     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
//                     border: 1px solid #DDD; 
//                     border-radius: 10px; 
//                     overflow: hidden;
//                 ">
//                     <thead>
//                         <tr style="
//                             background-color: #0F67B1; 
//                             color: #FFFFFF; 
//                             text-align: left;
//                             border-bottom: 2px solid #DDD;
//                         ">
//                             <th style="padding: 12px 15px; border-right: 1px solid #DDD;">Vessel Name</th>
//                             <th style="padding: 12px 15px;">IMO</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         ${vesselsByGeofence[geofence]
//                             .map((v, index) => `
//                                 <tr style="
//                                     background-color: ${index % 2 === 0 ? '#F9F9F9' : '#FFFFFF'}; 
//                                     border-bottom: 1px solid #DDD; 
//                                     transition: background-color 0.3s ease;
//                                 " 
//                                 onmouseover="this.style.backgroundColor='#EAF3FF';" 
//                                 onmouseout="this.style.backgroundColor='${index % 2 === 0 ? '#F9F9F9' : '#FFFFFF'}';">
//                                     <td style="padding: 10px 15px; border-right: 1px solid #DDD;">${v.NAME}</td>
//                                     <td style="padding: 10px 15px;">${v.IMO}</td>
//                                 </tr>
//                             `)
//                             .join('')}
//                     </tbody>
//                 </table>
//             </div>
//         `)
//         .join('');

//     const mailOptions = {
//         from: emailUser,
//         bcc: emailvs,
//         subject: 'Hyla-Alert',
//         html: `
//             <p style="
//                 font-family: Arial, sans-serif; 
//                 font-size: 14px; 
//                 color: #333; 
//                 margin-bottom: 20px;
//             ">
//                 The following vessels are within the Zone:
//             </p>
//             ${emailBody}
//         `,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Error sending email:', error);
//         } else {
//             console.log('Email sent:', info.response);
//         }
//     });
// }



// Default intervals for roles
// const defaultIntervals = {
//   "hyla admin": { sat0: 6 * 60 * 60 * 1000, sat1a: 12 * 60 * 60 * 1000, sat1b: 24 * 60 * 60 * 1000 }, // 6hrs, 12hrs, 24hrs
//   "guest": { sat0: 6 * 60 * 60 * 1000, sat1a: 12 * 60 * 60 * 1000, sat1b: 24 * 60 * 60 * 1000 }, // 6hrs, 12hrs, 24hrs
// };

async function getOrganizationIntervals(orgRef) {
    if (!orgRef) {
    console.warn(`No orgRef provided for getOrganizationIntervals`);
    return await getRoleBasedInterval("guest");
  }

  const aisSatPullConfig = await AisSatPull.findOne({ orgObjectId: orgRef });

  if (!aisSatPullConfig) {
    console.error(`No AisSatPull config found for organization: ${orgRef}`);
    return await getRoleBasedInterval("guest"); // Use guest's default if no specific configuration is found
  }

  const fallback = await getRoleBasedInterval("hyla admin");

  return {
    sat0: aisSatPullConfig.sat0 || fallback.sat0,
    sat1a: aisSatPullConfig.sat1a || fallback.sat1a,
    sat1b: aisSatPullConfig.sat1b || fallback.sat1b,
  };
}

// Get interval based on who is tracking the vessel and geofence type
async function getVesselInterval(IMO, geofenceType) {
  const trackedUsers = await TrackedVesselByUser.find({ IMO });
  const loginUserIds = trackedUsers.map(v => v.loginUserId);
  const trackingUsers = await LoginUsers.find({ loginUserId: { $in: loginUserIds }, active: true });

  const intervals = await Promise.all(trackingUsers.map(async (user) => {
    const { role, orgRef } = user;
    if (role === 'hyla admin' || role === 'guest') {
      return await getRoleBasedInterval(role);
    } else if ((role === 'organization admin' || role === 'organizational user') && orgRef) {
      return await getOrganizationIntervals(orgRef);
    }
    return null;
  }));

  const valid = intervals.filter(Boolean);

  const fallback = await getRoleBasedInterval("guest");
  const min = {
    sat0: valid.length ? Math.min(...valid.map(i => i.sat0)) : fallback.sat0,
    sat1a: valid.length ? Math.min(...valid.map(i => i.sat1a)) : fallback.sat1a,
    sat1b: valid.length ? Math.min(...valid.map(i => i.sat1b)) : fallback.sat1b,
  };

  switch (geofenceType) {
    case 'inport': return min.sat0;
    case 'terrestrial':
    case 'boundary': return min.sat1a;
    default: return min.sat1b;
  }
}

  let lastEmailSentAt = null; // To track the last email sent time



// Function to parse dimensions string into an object
function parseDimensions(dimStr) {
  const dimensions = {};
  const pairs = dimStr.split(',').map(part => part.trim());
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim());
    dimensions[key] = Number(value);
  }
  return dimensions;
}

async function fetchVesselAISFromProvider(vessel, apiMapping, sat) {
  const { apiName, apiUrl, apiKey } = apiMapping;
  try {
    if (apiName === 'lloyds') {
      const headers = { Authorization: apiKey };
      const params = { vesselImo: vessel.AIS.IMO };
      const response = await axios.get(apiUrl, { headers, params });
      return response.data?.Data?.AisPositions?.[0] || {};
    } else if (apiName === 'vtexplorer') {
      const params = {
        userkey: apiKey,
        imo: vessel.AIS.IMO,
        format: 'json',
        sat,
      };
      const response = await axios.get(apiUrl, { params });
      return response.data?.[0]?.AIS || {};  // No mapping or AIS_EXTRA for vtexplorer
    } else {
      const params = {
        userkey: apiKey,
        imo: vessel.AIS.IMO,
        format: 'json',
        sat,
      };
      const response = await axios.get(apiUrl, { params });
      return response.data?.[0]?.AIS || {};
    }
  } catch (err) {
    console.error('Error fetching AIS data from provider:', err);
    return null;
  }
}

// Utility function to extract data from paths in the API response
function getValueFromPath(obj, path) {
  try {
    return path.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) return undefined;
      if (/^\d+$/.test(part)) return acc[parseInt(part, 10)];
      return acc[part];
    }, obj);
  } catch (err) {
    console.error(`Error accessing path "${path}" on object:`, err);
    return undefined;
  }
}

function extractAISData(apiData, mapping) {
  const AIS = {};
  const plainMapping = mapping instanceof Map ? Object.fromEntries(mapping) : mapping;

  for (const [key, path] of Object.entries(plainMapping)) {
 // If the mapping is null, explicitly set the value to null
    if (path === null) {
      AIS[key] = null;
      continue;
    }

    if (typeof path !== 'string') {
      console.warn(`Skipping invalid mapping path for key "${key}":`, path);
      continue;
    }
    AIS[key] = getValueFromPath(apiData, path);
  }

  // Parse dimensions if the API response includes them
  if (apiData?.Dimensions) {
    AIS["Dimensions"] = parseDimensions(apiData.Dimensions);
  }

  return AIS;
}


function extractExtraFields(apiData, newFields) {
  const AIS_EXTRA = {};

  for (const [originalField, fieldInfo] of Object.entries(newFields || {})) {
    const value = getValueFromPath(apiData, originalField);
    if (value !== undefined) {
      AIS_EXTRA[fieldInfo.targetName] = value;
    }
  }

  return AIS_EXTRA;
}

// Example function to handle fetching data from the appropriate API
async function fetchAISDataFromApi(imo, apiName, apiUrl, apiKey, sat = '1') {
  let responseData = {};

  if (apiName === 'lloyds') {
    // Handle Lloyds API
    const headers = { Authorization: apiKey };
    const params = { vesselImo: imo }; // Lloyds uses "vesselImo" as the parameter
    try {
      const response = await axios.get(apiUrl, { headers, params });
      responseData = response.data?.Data?.AisPositions?.[0] || {};
    } catch (error) {
      console.error('Error fetching data from Lloyds API:', error);
      responseData = {};
    }
  } else if (apiName === 'vtexplorer') {
    // Handle VTExplorer API
    const params = {
      userkey: apiKey,
      imo: imo, // Use the IMO parameter to fetch vessel data
      format: 'json',
      sat, // Optional parameter for satellite (default '1')
    };
    try {
      const response = await axios.get(apiUrl, { params });
      responseData = response.data?.[0]?.AIS || {};
    } catch (error) {
      console.error('Error fetching data from VTExplorer API:', error);
      responseData = {};
    }
  }

  return responseData;
}


app.get('/api/ais-data', async (req, res) => {
  const { imo } = req.query; // Extract IMO from query parameters
  let activeApiMapping;

  try {
    // Find the active API mapping with the approved status
    activeApiMapping = await VesselApiMapping.findOne({
      isActive: true,
      status: 'approved',
    });

    if (!activeApiMapping) {
      return res.status(400).send('No active, approved API mapping found');
    }

    const { apiName, apiUrl, apiKey, mapping, newFields } = activeApiMapping;

    // Fetch AIS data using the dynamic API configuration
    const apiData = await fetchAISDataFromApi(imo, apiName, apiUrl, apiKey);

    // Extract AIS data using the mapping
    const AIS = extractAISData(apiData, mapping);

    // Extract additional fields (AIS_EXTRA)
    const AIS_EXTRA = extractExtraFields(apiData, newFields);

    // Return both AIS and AIS_EXTRA as part of the response
    res.json({ AIS, AIS_EXTRA });
  } catch (error) {
    console.error('Error fetching vessel data:', error);
    res.status(500).send(error.toString());
  }
});

async function checkAndUpdateVesselData() {
  try {
    const vessels = await TrackedVessel.find({ trackingFlag: true, alertCheckDone: true});
    const currentTime = new Date();

  const apiMapping = await VesselApiMapping.findOne({ isActive: true , status: "approved"  });

if (!apiMapping) {
  console.error('No active API mapping found');
  return;
}

  const { mapping, newFields } = apiMapping;


      const TerrestrialGeofences = await TerrestrialGeofence.find();
      if (!TerrestrialGeofences || TerrestrialGeofences.length === 0) {
        console.error('No geofences found.');
        return;
      }

      const vesselsInGeofence = [];
    for (const vessel of vessels) {
      const { LATITUDE: vesselLat, LONGITUDE: vesselLng, NAME, IMO } = vessel.AIS;
      const vesselPoint = turf.point([vesselLng, vesselLat]);

      let isInsideAnyGeofence = false;
      let geofenceDetails = {};
      let interval = null;
      let sat = 1; // Default to sat1b (longest interval)

    
          for (const geofence of TerrestrialGeofences) {
             const geofenceCoordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
                  if (geofenceCoordinates[0][0] !== geofenceCoordinates[geofenceCoordinates.length - 1][0] ||
                      geofenceCoordinates[0][1] !== geofenceCoordinates[geofenceCoordinates.length - 1][1]) {
                      geofenceCoordinates.push(geofenceCoordinates[0]);
                  }
        const geofencePolygonTr = turf.polygon([geofenceCoordinates]);
        const isInside = turf.booleanPointInPolygon(vesselPoint, geofencePolygonTr);

        if (isInside) {
          isInsideAnyGeofence = true;
          geofenceDetails = {
            geofenceName: geofence.geofenceName,
            geofenceFlag: 'Inside',
            entryTime: new Date().toISOString(),
            exitTime: null,
          };
          vesselsInGeofence.push({ IMO, NAME, geofenceName: geofence.geofenceName });
          interval = await getVesselInterval(IMO, geofence.geofenceType);
          sat = geofence.geofenceType === 'inport' ? 0 : 1;
          break; // Stop further checks
        }
      }

      // If not inside any geofence, get sat1b interval (outside logic)
      if (!isInsideAnyGeofence) {
        const tracking = await TrackedVesselByUser.find({ IMO });
        const intervalsToConsider = await Promise.all(tracking.map(async ({ loginUserId }) => {
          const user = await LoginUsers.findOne({ loginUserId });
          if (!user) return null;
         
            const { role, orgRef } = user;
          if (role === 'hyla admin' || role === 'guest') {
            const fallback = await getRoleBasedInterval(role);

            return fallback.sat1b;
          } else if ((role === 'organization admin' || role === 'organizational user') && orgRef) {
            const userIntervals = await getOrganizationIntervals(orgRef);
            return userIntervals.sat1b;
          }

        
        }));

        const validIntervals = intervalsToConsider.filter(i => i !== null);
        if (validIntervals.length) {
          interval = Math.min(...validIntervals);
        } else {
          const fallback = await getRoleBasedInterval("guest");
          interval = fallback.sat1b;
        }

        sat = 1; // sat1b
        // console.log(IMO,interval);
      }

      if (!interval || isNaN(interval)) {
        console.warn(`Skipping ${NAME} (IMO: ${IMO}) due to invalid interval.`);
        continue;
      }

      // --- Fetch if interval has passed ---
      const lastFetchTime = vessel.lastFetchTime ? new Date(vessel.lastFetchTime) : null;
      const timeElapsed = lastFetchTime ? currentTime - lastFetchTime : interval;

      if (!lastFetchTime || timeElapsed >= interval) {
        console.log(`Fetching AIS data for ${NAME} (IMO: ${IMO}) with sat ${sat} and interval ${interval / (60 * 60 * 1000)} hrs`);

        // const response = await axios.get(apiUrl, {
        //   params: {
        //     userkey,
        //     imo: vessel.AIS.IMO,
        //     format: 'json',
        //     sat,
        //   },
        // });

        // const AIS = response.data[0]?.AIS;

         

        const apiData = await fetchVesselAISFromProvider(vessel, apiMapping, sat);
          if (!apiData) continue;

        let AIS = {};
        if (apiMapping.apiName === 'vtexplorer') {
          // Directly set AIS for vtexplorer
          AIS = apiData;
        } else {
          // For other APIs, extract AIS using mapping
          AIS = extractAISData(apiData, mapping);
        }

        console.log('aaaaaaaaaa',AIS);

        // For non-vtexplorer API, extract additional fields
        let AIS_EXTRA = {};
        if (apiMapping.apiName !== 'vtexplorer') {
          AIS_EXTRA = extractExtraFields(apiData, newFields);
        }
        console.log('bbbbbbbbb',AIS_EXTRA);


        if (AIS && AIS.LATITUDE && AIS.LONGITUDE) {
          const locationChanged = AIS.LATITUDE !== vesselLat || AIS.LONGITUDE !== vesselLng;
          if (locationChanged) {
            await axios.put(`${reactAPI}/api/updateVesselLocation/${AIS.IMO}`, {
                ...AIS,
                 AIS_EXTRA,
              lastFetchTime: currentTime,
              geofenceDetails: isInsideAnyGeofence ? geofenceDetails : null,
            });
            console.log(`Vessel ${NAME} (IMO: ${IMO}) location updated.`);
            await TrackedVessel.updateOne({ _id: vessel._id }, { lastFetchTime: currentTime, alertCheckDone: false});
            
            const bufferExists = await VesselBufferGeofence.countDocuments({ IMO: AIS.IMO });
            if (bufferExists > 0) {
              await axios.put(`${reactAPI}/api/updateVesselBufferGeofence/${AIS.IMO}`, {
                NAME,
                TIMESTAMP: AIS.TIMESTAMP,
                LATITUDE: AIS.LATITUDE,
                LONGITUDE: AIS.LONGITUDE
              });
              console.log(`Updated Vessel Buffer Geofence for IMO: ${AIS.IMO}`);
            }
          } 
        else {
          // here we have to make alertCheckDone: true, because when no AIS update then no need to create alert check
            await TrackedVessel.updateOne({ _id: vessel._id }, { lastFetchTime: currentTime, alertCheckDone: true });
            console.log(`Vessel ${NAME} (IMO: ${IMO}) location unchanged. Skipping update.`);
          }

        } else {
          console.error(`Invalid AIS data for ${NAME}`);
          continue;
        }
      } else {
        const remaining = ((interval - timeElapsed) / (60 * 1000));
      if (!isNaN(remaining)) {
        console.log(`Skipping ${NAME} (IMO: ${IMO}) - ${remaining.toFixed(1)} mins remaining.`);
      } else {
        console.warn(`Skipping ${NAME} (IMO: ${IMO}) - Unable to compute remaining time (invalid interval or lastFetchTime).`);
      }
      }
    }

    // Optional: Consolidated Email Logic
    const hour = currentTime.getHours();
    if ((hour === 9 || hour === 14) && lastEmailSentAt !== hour && vesselsInGeofence.length > 0) {
      sendConsolidatedEmail(vesselsInGeofence);
      lastEmailSentAt = hour;
    }

  } catch (error) {
    console.error('Error checking and updating vessel data:', error);
  } finally {
    setTimeout(checkAndUpdateVesselData, 60 * 1000); // Run every minute
  }
}



//   // Start the cron job
  checkAndUpdateVesselData();



const sendEmail = async (bcc, subject, html) => {
  try {

    const transporter = nodemailer.createTransport({
  
    service: 'gmail', // or another email service provider
    auth: {
        user: emailUser,
        pass: emailPass,
    }
});


    return await transporter.sendMail({
      from: emailUser,
      bcc,
      subject,
      html,
    });
  } catch (err) {
    console.error(`❌ Transporter error for subject "${subject}":`, err);
    throw err;
  }
};


  const processPendingEmails = async () => {
  try {
    const now = new Date();

    const pendingEmails = await PendingEmail.find({
      scheduledTime: { $lte: now }
    });

    for (const email of pendingEmails) {
      const {
        IMO,
        vesselName,
        geofence,
        emailType,
        eventTimestamp,
        role,
        loginUserId,
        orgRef
      } = email;

      let recipients = [];

      if (['hyla admin', 'guest'].includes(role)) {
        const user = await LoginUsers.findOne({ loginUserId, active: true });
        if (user?.email) recipients.push(user.email.trim());
      } else if (role === 'organization' && orgRef) {
        const orgUsers = await LoginUsers.find({ orgRef, active: true });
        
        recipients = orgUsers.map(u => u.email.trim()).filter(Boolean);
        console.log(recipients);
      }

      if (recipients.length === 0) {
        console.warn(`⚠️ No recipients for PendingEmail ${email._id}`);
        await PendingEmail.updateOne({ _id: email._id }, { $set: { status: 'failed' } });
        continue;
      }

      const statusWord = emailType === 'entry' ? 'arrived' : 'departed';
      const location = geofence.seaport
        ? `${geofence.geofenceName} - ${geofence.seaport}`
        : geofence.geofenceName;

      const subject = `Vessel-${vesselName} ${statusWord} ${location}`;
      
       const message = `
        <p>The vessel <strong>${vesselName}</strong> (IMO: ${IMO}) has <strong>${statusWord}</strong> <strong>${location}</strong>.</p>
        <p>This event occurred at <strong>${new Date(eventTimestamp).toUTCString()}</strong>.</p>
        <p>Best regards,<br/>Team Hylapps</p>
      `;

      try {
        await sendEmail(recipients, subject, message);

        // ✅ On success: delete + log
        await PendingEmail.deleteOne({ _id: email._id });

        const logQuery = role === 'organization'
          ? { orgRef, role }
          : { loginUserId, role };

        const emailLogEntry = {
          type: emailType,
          sentAt: now,
          IMO,
          eventTimestamp,
          geofence: {
            geofenceRef: geofence.geofenceRef,
            geofenceType: geofence.geofenceType
          }
        };

        await UserEmailLog.updateOne(
          logQuery,
          {
            $push: { emailLog: emailLogEntry },
            $set: { lastSentAt: now }
          },
          { upsert: true }
        );

        console.log(`✅ Email sent & logged → IMO ${IMO} | ${role}`);
      } catch (sendErr) {
        console.error(`❌ Email send failed for PendingEmail ${email._id}:`, sendErr);
        await PendingEmail.updateOne({ _id: email._id }, { $set: { status: 'failed' } });
      }
    }
  } catch (err) {
    console.error('❌ Error in processPendingEmails:', err);
  }
};

const sendCustomAlertEmail = async (bcc, subject, html) => {
  try {

    const transporter = nodemailer.createTransport({
  
    service: 'gmail', // or another email service provider
    auth: {
        user: emailUser,
        pass: emailPass,
    }
});


    return await transporter.sendMail({
      from: emailUser,
      bcc,
      subject,
      html,
    });
  } catch (err) {
    console.error(`❌ Transporter error for subject "${subject}":`, err);
    throw err;
  }
};

const operatorToHuman = (op) => {
  switch (op) {
    case '==': return 'equal to';
    case '!=': return 'not equal to';
    case '>': return 'greater than';
    case '<': return 'less than';
    case '>=': return 'greater than or equal to';
    case '<=': return 'less than or equal to';
    case 'between': return 'between';
    default: return op;
  }
};

const processPendingCustomAlertEmails = async () => {
  try {
    const now = new Date();

    const pendingEmails = await PendingCustomAlertEmail.find({
      scheduledTime: { $lte: now }
    });

    for (const email of pendingEmails) {
      const {
        role,
        loginUserId,
        orgRef,
        customAlert,
        IMO,
        vesselName,
        eventTimestamp,
        _id,
      } = email;

      let subject = `Custom Alert Notification - ${vesselName}`;
      let recipients = [];

      // Determine recipients
      if (['hyla admin', 'guest'].includes(role)) {
        const user = await LoginUsers.findOne({ loginUserId, active: true });
        if (user?.email) recipients.push(user.email.trim());
      } else if (role === 'organization' && orgRef) {
        const orgUsers = await LoginUsers.find({ orgRef, active: true });
        recipients = orgUsers.map((u) => u.email.trim()).filter(Boolean);
      }

      if (recipients.length === 0) {
        console.warn(`⚠️ No recipients found for PendingCustomAlertEmail ${_id}`);
        await PendingCustomAlertEmail.updateOne({ _id }, { $set: { status: 'failed' } });
        continue;
      }

      const { ais, geofence } = customAlert;
      const alertType = customAlert.alertType;
      const messageParts = [];

      const readableDate = new Date(eventTimestamp).toUTCString();

      // Header
      messageParts.push(`
        <p>Alert triggered for vessel <strong>${vesselName}</strong> (IMO: ${IMO}) on ${readableDate}.</p>
        <hr/>
      `);

      // AIS Conditions
      if (['ais', 'both'].includes(alertType) && Array.isArray(ais?.passedConditions)) {
        if (ais.passedConditions.length > 0) {
          messageParts.push(`<p><strong>📡 AIS Condition(s) Met:</strong></p><ul>`);

          for (const cond of ais.passedConditions) {
            const config = aisFieldConfig[cond.field];
            const fieldLabel = config?.label || cond.field || 'Unknown Field';
            let description = '';

            if (cond.operator === 'between' && typeof cond.value === 'object') {
              const { start, end } = cond.value;
              description = `The vessel's <strong>${fieldLabel}</strong> was <strong>${cond.actual}</strong>, which is between ${start} and ${end}.`;
            } else {
              description = `The vessel's <strong>${fieldLabel}</strong> was <strong>${cond.actual}</strong>, which is ${operatorToHuman(cond.operator)} ${cond.value}.`;
            }

            messageParts.push(`<li>${description}</li>`);
          }

          messageParts.push('</ul><hr/>');
        } else {
          messageParts.push(`<p>No AIS conditions matched, but alert triggered due to geofence activity.</p><hr/>`);
        }
      }

      // Geofence Info
      let geofenceName = '';
      let seaport = '';

      if (['geofence', 'both'].includes(alertType) && geofence?.geofenceRef && geofence?.geofenceType) {
        const { geofenceRef, geofenceType } = geofence;

        const geofenceModels = {
          Polygon: PolygonGeofence,
          Polycircle: PolyCircleGeofence,
          Polyline: PolyLineGeofence,
          Advanced: TerrestrialGeofence,
        };

        const GeofenceModel = geofenceModels[geofenceType];

        if (GeofenceModel) {
          const geofenceDoc = await GeofenceModel.findById(geofenceRef).lean();

          if (geofenceDoc) {
            geofenceName = geofenceDoc.geofenceName || '';
            seaport = geofenceDoc.seaport || '';
          }
        } else {
          console.warn(`Unknown geofence type: ${geofenceType}`);
        }

        if (geofenceName) {
          const action = geofence.entryOrExit === 'entry' ? 'arrived' : 'departed';
          const location = seaport ? `${geofenceName} - ${seaport}` : geofenceName;

          messageParts.push(
            `<p><strong>📍 Geofence Activity:</strong></p><ul><li>The vessel has ${action} <strong>${location}</strong>.</li></ul><hr/>`
          );

          
        }
      }

      messageParts.push(`
        <p>Regards,<br/>Team Hylapps</p>
      `);

      const fullMessage = messageParts.join('\n');

      // Send email
      try {
        await sendCustomAlertEmail(recipients, subject, fullMessage);
        await PendingCustomAlertEmail.deleteOne({ _id });

        const logQuery = role === 'organization'
          ? { orgRef, role }
          : { loginUserId, role };

        const emailLogEntry = {
          type: 'customAlert',
          sentAt: new Date(),
          IMO,
          eventTimestamp,
          customAlert,
        };

        await UserEmailLog.updateOne(
          logQuery,
          {
            $push: { emailLog: emailLogEntry },
            $set: { lastSentAt: new Date() },
          },
          { upsert: true }
        );

        console.log(`✅ Email sent → IMO ${IMO} | Role: ${role}`);
      } catch (sendErr) {
        console.error(`❌ Email send failed for ${_id}:`, sendErr);
        await PendingCustomAlertEmail.updateOne({ _id }, { $set: { status: 'failed' } });
      }
    }
  } catch (err) {
    console.error('❌ Error in processPendingCustomAlertEmails:', err);
  }
};



// Schedule to run every 5 minutes
cron.schedule('*/1 * * * *', async () => {
  console.log(`🔁 Running email job at ${new Date().toLocaleString()}`);
  await processPendingEmails();
  await processPendingCustomAlertEmails();
});


// Define the VesselHistory schema
const vesselHistorySchema = new mongoose.Schema({
    // vesselId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackedVessel', required: true },
    vesselName: String,
    IMO: { type:Number, unique: true},

    history: [{
      AIS: {
        MMSI: Number,
        TIMESTAMP: String,
        LATITUDE: Number,
        LONGITUDE: Number,
        COURSE: Number,
        SPEED: Number,
        HEADING: Number,
        NAVSTAT: Number,
        IMO: Number,
        NAME: String,
        CALLSIGN: String,
        TYPE: Number,
        A: Number,
        B: Number,
        C: Number,
        D: Number,
        DRAUGHT: Number,
        DESTINATION: String,
        LOCODE: String,
        ETA_AIS: String,
        ETA: String,
        SRC: String,
        ZONE: String,
        ECA: Boolean,
        DISTANCE_REMAINING: Number,
        ETA_PREDICTED: String,
    },
     AIS_EXTRA: {
            type: mongoose.Schema.Types.Mixed, // Flexible schema to store new fields
            default: {}
        },
        LATITUDE: Number,
        LONGITUDE: Number,
        TIMESTAMP: String,
        geofenceName: { type: String, default: null },
        geofenceType: { type: String, default: null },
        seaport: { type: String, default: null },
        geofenceRef:  { type: mongoose.Schema.Types.ObjectId, default: null },
        geofenceFlag: { type: String, default: null },
        entryTime: { type: Date, default: null },
        exitTime: { type: Date, default: null },
    }],
    updatedAt: { type: Date, default: Date.now }
});

const VesselHistory = mongoose.model('VesselHistory', vesselHistorySchema, 'vesselHistories');


// Route to fetch all vessel history documents
app.get('/api/get-vessel-histories', async (req, res) => {
    try {
        // Find all vessel history documents
        const vesselHistories = await VesselHistory.find();
        //  console.log(vesselHistories);

        res.json(vesselHistories);
    } catch (error) {
        console.error('Error fetching vessel histories:', error);
        res.status(500).json({ error: 'Error fetching vessel histories' });
    }
});


app.get('/api/vesselHistoryEvents/:IMO', async (req, res) => {
  const IMO = parseInt(req.params.IMO);

  try {
    const vesselHistory = await VesselHistory.findOne({ IMO });

    if (!vesselHistory || !vesselHistory.history.length) {
      return res.status(404).json({ message: `No history found for IMO ${IMO}` });
    }

    const sortedHistory = vesselHistory.history.sort((a, b) => new Date(a.TIMESTAMP) - new Date(b.TIMESTAMP));

     // Get all unique geofence names used in the history
     const uniqueGeofences = [...new Set(sortedHistory.map(entry => entry.geofenceName).filter(Boolean))];

     // Fetch all polygons and polylines at once
     const [polygonGeofences, polylineGeofences] = await Promise.all([
       PolygonGeofence.find({ geofenceName: { $in: uniqueGeofences } }, { geofenceName: 1, seaport: 1 }),
       PolyLineGeofence.find({ geofenceName: { $in: uniqueGeofences } }, { geofenceName: 1, seaport: 1 })
     ]);
 
     // Build lookup map: { geofenceName: seaport }
     const seaportMap = {};
     [...polygonGeofences, ...polylineGeofences].forEach(geo => {
       seaportMap[geo.geofenceName] = geo.seaport;
     });

     
    const events = [];
    let currentEntry = null;

    for (const entry of sortedHistory) {
      const { geofenceName,geofenceFlag, entryTime, exitTime } = entry;

    
      const seaport = seaportMap[geofenceName] || "-";
     
      if (geofenceName && entryTime) {
        if (!currentEntry) {
          currentEntry = {
            geofenceName,
            seaport,
            geofenceFlag,
            entryTime,
            exitTime: null
          };
        } else if (currentEntry.geofenceName !== geofenceName) {
          currentEntry.exitTime = new Date(entry.TIMESTAMP).toISOString();
          events.push({ ...currentEntry, duration: calculateDuration(currentEntry.entryTime, currentEntry.exitTime) });

          currentEntry = {
            geofenceName,
            seaport,
            geofenceFlag,
            entryTime,
            exitTime: null
          };
        }

        if (exitTime && currentEntry && currentEntry.geofenceName === geofenceName) {
          currentEntry.exitTime = exitTime;
          events.push({ ...currentEntry, duration: calculateDuration(currentEntry.entryTime, currentEntry.exitTime) });
          currentEntry = null;
        }

      } else if (currentEntry && (!geofenceName || entry.geofenceFlag === 'Outside')) {
        currentEntry.exitTime = new Date(entry.TIMESTAMP).toISOString();
        events.push({ ...currentEntry, duration: calculateDuration(currentEntry.entryTime, currentEntry.exitTime) });
        currentEntry = null;
      }
    }

    if (currentEntry) {
      events.push({ ...currentEntry, duration: null }); // Still inside
    }

    res.status(200).json({
      vesselName: vesselHistory.vesselName,
      IMO: vesselHistory.IMO,
      events: events.reverse()
    });

  } catch (error) {
    console.error('Error fetching vessel history events:', error);
    res.status(500).json({ message: 'Error fetching vessel history events', error });
  }
});

// Helper function to format duration
function calculateDuration(start, end) {
  if (!start || !end) return null;

  const duration = moment.duration(moment(end).diff(moment(start)));
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  result += `${minutes}m`;

  return result.trim();
}





app.get('/api/get-geofence-types', async (req, res) => {
  try {
     
      const geofenceTypes = await HylaGeofenceTypes.find();
   
      res.json(geofenceTypes);
  } catch (error) {
      console.error('Error fetching geofence types:', error);
      res.status(500).json({ error: 'Error fetching geofence types' });
  }
});


// Helper function to check if vessel is inside any geofence
const checkVesselInGeofences = (vesselLat, vesselLng, polygonGeofences, circleGeofences, polylineGeofences) => {
    const vesselPoint = turf.point([vesselLng, vesselLat]);
    let isInsideAnyGeofence = false;
    let geofenceDetails = {};
  
    // Check Polygon Geofences
    polygonGeofences.forEach((geofence) => {
      let geofenceCoordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
      
      // Ensure the first and last points are the same
      if (geofenceCoordinates[0][0] !== geofenceCoordinates[geofenceCoordinates.length - 1][0] || 
          geofenceCoordinates[0][1] !== geofenceCoordinates[geofenceCoordinates.length - 1][1]) {
        geofenceCoordinates.push(geofenceCoordinates[0]); // Close the polygon
      }
      
      const geofencePolygon = turf.polygon([geofenceCoordinates]);
      const isInside = turf.booleanPointInPolygon(vesselPoint, geofencePolygon);
    
      if (isInside) {
        isInsideAnyGeofence = true;
        geofenceDetails = {
          geofenceRef: geofence._id,
          geofenceName: geofence.geofenceName || null,
          geofenceType: geofence.type || 'Polygon',
          seaport: geofence.seaport || null,
          geofenceCategory: geofence.geofenceType || null,
          geofenceFlag: 'Inside',
          entryTime: new Date().toISOString(),
          exitTime: null,
        };
        
      }
    });
  

    // Check Circle Geofences
    circleGeofences.forEach((geofence) => {
      const { lat, lng, radius } = geofence.coordinates[0];
      const distance = turf.distance(vesselPoint, turf.point([lng, lat]), { units: 'meters' });
      if (distance <= radius) {
        isInsideAnyGeofence = true;
        geofenceDetails = {
          geofenceRef: geofence._id,
          geofenceName: geofence.geofenceName || null,
          geofenceType: geofence.type || 'Polycircle',
          seaport: geofence.seaport || null,
          geofenceCategory: geofence.geofenceType || null,
          geofenceFlag: 'Inside',
          entryTime: new Date().toISOString(),
          exitTime: null,
        };
      }
    });
  

    // Check Polyline Geofences
    polylineGeofences.forEach((geofence) => {
      const geofenceLine = turf.lineString(geofence.coordinates.map(coord => [coord.lng, coord.lat]));
      const distanceToPolyline = turf.pointToLineDistance(vesselPoint, geofenceLine, { units: 'meters' });
      if (distanceToPolyline <= 3000) {
        isInsideAnyGeofence = true;
        geofenceDetails = {
          geofenceRef: geofence._id,
          geofenceName: geofence.geofenceName || null,
          geofenceType: geofence.type || 'Polyline',
          seaport: geofence.seaport || null,
          geofenceCategory: geofence.geofenceType || null,
          geofenceFlag: `Near ${Math.round(distanceToPolyline)} meters`,
          entryTime: new Date().toISOString(),
          exitTime: null,
        };
      }
    });
  
    return { isInsideAnyGeofence, geofenceDetails };
  };
  
  
  
// // Helper functions to send entry and exit emails
async function sendEntryEmail(vessel, toEmails, geofenceName, seaport) {
  console.log('entered');
  console.log(seaport);

  const document = await EmailForAlerts.findOne();

  
  const mailOptions = {
    from: emailUser,
    bcc: toEmails , 
    subject: `${vessel.AIS.NAME} arrived ${geofenceName} - ${seaport}`,
    text: `${vessel.AIS.NAME} (IMO: ${vessel.AIS.IMO}) has arrived ${geofenceName} - ${seaport}.`
  };

  try {
    // Create a transporter object with SMTP transport
const transporter = nodemailer.createTransport({

service: 'gmail', // or another email service provider
auth: {
    user: emailUser,
    pass: emailPass,
}
});
    await transporter.sendMail(mailOptions);
    console.log('Entry email sent successfully');
  } catch (error) {
    console.error('Error sending entry email:', error);
  }
}

async function sendExitEmail(vessel, toEmails,  geofenceName) {
  const document = await EmailForAlerts.findOne();
  const email =document.email;
  
  const mailOptions = {
    from: emailUser,
    bcc: toEmails, 
    subject: `${vessel.AIS.NAME} departed ${geofenceName}`,
    text: `${vessel.AIS.NAME} (IMO: ${vessel.AIS.IMO}) has departed ${geofenceName}.`
  };

  try {
    // Create a transporter object with SMTP transport
const transporter = nodemailer.createTransport({

service: 'gmail', // or another email service provider
auth: {
    user: emailUser,
    pass: emailPass,
}
});
    await transporter.sendMail(mailOptions);
    console.log('Exit email sent successfully');
  } catch (error) {
    console.error('Error sending exit email:', error);
  }
}


// Define the User Model
// ----------------------------


async function sendWelcomeEmail(newUser) {
  // Define the static recipients.
  const recipients = [
    'kdalvi@hylapps.com',
    'abhishek.nair@hylapps.com',
    'sales@adyarpagnya.com',
    'srikantha.gis@gmail.com',
    'hemanthsrinivas707@gmail.com'
  ];

  // For each organization user, create a table with module permissions.
  // Assuming newUser.selectedUser is an array of user names.
  const userTables = newUser.selectedUser
    .map((userFirstName,userLastName, userIndex) => {
      // Create table rows for each module permission with alternating row colors.
      const rows = newUser.modulePermissions
        .map((mod, index) => {
          const rowBg = index % 2 === 0 ? '#f2f2f2' : '#ffffff';
          return `
            <tr style="background-color: ${rowBg};">
              <td style="border: 1px solid #ddd; padding: 8px;">${mod.moduleName}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${mod.enabled ? 'Enabled' : 'Disabled'}</td>
            </tr>`;
        })
        .join('');
      
      return `
        <h3>${user.firstName} ${user.lastName}</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #0f67b1; color: #ffffff;">
              <th style="border: 1px solid #ddd; padding: 8px;">Notification Type</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Enabled/Disabled</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;
    })
    .join('');

  // Generate the full HTML content including the dynamically generated user tables.
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>
        <p>Your organization <strong>${newUser.selectedOrganization}</strong> has been updated with new notifications. Please see the details below:</p>
        ${userTables}
        <p>Regards,<br>Hyla</p>
      </body>
    </html>`;

  const mailOptions = {
    from: emailUser,
    bcc: recipients, // Send email to the static list.
    subject: `HylaNotification Mail: ${newUser.selectedOrganization}`,
    html: htmlContent, // Use the HTML version of the email.
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or another email service
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    await transporter.sendMail(mailOptions);
    console.log('HylaNotification Mail sent successfully to:', recipients);
  } catch (error) {
    console.error('Error sending HylaNotification Mail:', error);
  }
}



// ----------------------------
// Endpoints
// ----------------------------

// Create user and send welcome email
// app.post('/api/notification/Notification-create', async (req, res) => {
//   try {
//     const {
//       orgId,
//       selectedOrganization,
//       address,
//       contactEmail,
//       selectedUser,
//       selectedUserEmails,
//       userType,
//       modulePermissions,
//     } = req.body;
    
//     // Log the incoming payload (ensure no sensitive data is leaked in production)
//     console.log('Received payload:', req.body);

//     // Validate required fields.
//     if (!orgId || !selectedOrganization || !contactEmail || selectedUser.length === 0) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Create the user record in your database.
//     const newUser = await User.create({
//       orgId,
//       selectedOrganization,
//       address,
//       contactEmail,
//       selectedUser,
//       userType,
//       modulePermissions,
//     });
//     console.log('New user created:', newUser);
    
//     // Trigger sending emails to the selected user emails.
//     if (selectedUserEmails && selectedUserEmails.length > 0) {
//       console.log('Sending welcome email to:', selectedUserEmails);
//       await sendWelcomeEmail(newUser, selectedUserEmails);
//     }

//     res.status(201).json({ message: 'User created successfully', user: newUser });
//   } catch (error) {
//     console.error('Error in /api/notification/Notification-create:', error);
//     res.status(500).json({ message: 'Error creating User or sending email.', error: error.message });
//   }
// });

app.post('/api/notification/Notification-create', async (req, res) => {
  try {
    const {
      orgId,
      selectedOrganization,
      address,
      contactEmail,
      selectedUser, // note: a single user object
      userType,
      modulePermissions,
    } = req.body;

    console.log('Received payload for individual user:', req.body);

    if (!orgId || !selectedOrganization || !contactEmail || !selectedUser) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create the record for an individual user
    const newUser = await User.create({
      orgId,
      selectedOrganization,
      address,
      contactEmail,
      selectedUser,
      userType,
      modulePermissions,
    });
    console.log('New user permission record created:', newUser);

    // Sending a welcome email could be modified accordingly if needed.
    await sendWelcomeEmail(newUser);

    res.status(201).json({ message: 'User record created successfully', user: newUser });
  } catch (error) {
    console.error('Error in /api/notification/Notification-create:', error);
    res.status(500).json({ message: 'Error creating user record or sending email.', error: error.message });
  }
});


// Update an individual user's permission record.
app.put('/api/notification/Notification-update', async (req, res) => {
  try {
    const {
      _id, // unique identifier for the record
      orgId,
      selectedOrganization,
      address,
      contactEmail,
      selectedUser,
      userType,
      modulePermissions,
    } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Record identifier is required' });
    }

    const updatedRecord = await User.findByIdAndUpdate(
      _id,
      { orgId, selectedOrganization, address, contactEmail, selectedUser, userType, modulePermissions },
      { new: true }
    );

    res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
  } catch (error) {
    console.error('Error in /api/notification/Notification-update:', error);
    res.status(500).json({ message: 'Error updating record', error: error.message });
  }
});

// List all individual user permission records.
app.get('/api/notification/Notification-list', async (req, res) => {
  try {
    const records = await User.find({});
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
});



// Example endpoint: Vessel Entry Email
app.post('/api/vessel/entry', async (req, res) => {
  try {
    const { vessel, toEmails, geofenceName, seaport } = req.body;
    const mailOptions = {
      from: emailUser,
      bcc: toEmails,
      subject: `${vessel.AIS.NAME} arrived ${geofenceName} - ${seaport}`,
      text: `${vessel.AIS.NAME} (IMO: ${vessel.AIS.IMO}) has arrived ${geofenceName} - ${seaport}.`,
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    await transporter.sendMail(mailOptions);
    console.log('Entry email sent successfully');
    res.status(200).json({ message: 'Entry email sent successfully' });
  } catch (error) {
    console.error('Error sending entry email:', error);
    res.status(500).json({ message: 'Error sending entry email', error: error.message });
  }
});

// Example endpoint: Vessel Exit Email
app.post('/api/vessel/exit', async (req, res) => {
  try {
    const { vessel, toEmails, geofenceName } = req.body;
    const mailOptions = {
      from: emailUser,
      bcc: toEmails,
      subject: `${vessel.AIS.NAME} departed ${geofenceName}`,
      text: `${vessel.AIS.NAME} (IMO: ${vessel.AIS.IMO}) has departed ${geofenceName}.`,
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    await transporter.sendMail(mailOptions);
    console.log('Exit email sent successfully');
    res.status(200).json({ message: 'Exit email sent successfully' });
  } catch (error) {
    console.error('Error sending exit email:', error);
    res.status(500).json({ message: 'Error sending exit email', error: error.message });
  }
});



// 

const getScheduledTime = (eventTime, lastSentAt, interval) => {
 
  if (!lastSentAt) return new Date(eventTime.getTime() + interval);

    // Ensure lastSentAt is a valid Date object
  const lastSent = new Date(lastSentAt);
  if (isNaN(lastSent.getTime())) throw new Error('Invalid lastSentAt date');

  const nextAllowed = new Date(lastSent.getTime() + interval);
  return nextAllowed > eventTime ? nextAllowed : new Date(eventTime.getTime() + interval);
};


const getSatTypeForVessel = async (LATITUDE, LONGITUDE) => {
  const TerrestrialGeofences = await TerrestrialGeofence.find();
  const vesselPoint = turf.point([LONGITUDE, LATITUDE]);

  for (const geofence of TerrestrialGeofences) {
    if (!Array.isArray(geofence.coordinates) || geofence.coordinates.length < 3) {
      continue; // skip malformed geofence
    }

    const geofenceCoordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
    if (
      geofenceCoordinates[0][0] !== geofenceCoordinates[geofenceCoordinates.length - 1][0] ||
      geofenceCoordinates[0][1] !== geofenceCoordinates[geofenceCoordinates.length - 1][1]
    ) {
      geofenceCoordinates.push(geofenceCoordinates[0]);
    }

    const polygon = turf.polygon([geofenceCoordinates]);
    const isInside = turf.booleanPointInPolygon(vesselPoint, polygon);
    if (isInside) {
      if (geofence.geofenceType === 'inport') return 'sat0';
      if (['terrestrial', 'boundary'].includes(geofence.geofenceType)) return 'sat1a';
      break;
    }
  }

  return 'sat1b'; // Default if outside all geofences
};


const getInterval = async (role, orgRef) => {
  if (role === 'hyla admin' || role === 'guest') {
    return await getRoleBasedInterval(role);
  } else {
    const orgConfig = await AisSatPull.findOne({ orgObjectId: orgRef });
    
    if (!orgConfig) {
      console.warn(`AisSatPull config not found for org ${orgRef}, using default intervals.`);
      const fallback = await getRoleBasedInterval("guest");
      return fallback; // or a specific fallback set you define
    }

    return {
      sat0: orgConfig.sat0,
      sat1a: orgConfig.sat1a,
      sat1b: orgConfig.sat1b,
    };
  }
};

const getLastSent = async ({ role, loginUserId, orgRef, imo }) => {
  let query;

  if (role === 'hyla admin' || role === 'guest') {
    query = { loginUserId, role };
  } else if (
    role === 'organization'
  ) {
    query = { orgRef, role };
  } else {
    throw new Error('Invalid role provided');
  }

  const log = await UserEmailLog.findOne(query);

  if (!log || !Array.isArray(log.emailLog)) return null;

  // Filter logs for the specific IMO and type 'entry' or 'exit'
  const filteredLogs = log.emailLog
    .filter(entry =>
      entry.IMO === imo &&
      (entry.type === 'entry' || entry.type === 'exit')
    )
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    

  return filteredLogs.length > 0 ? filteredLogs[0].sentAt : null;
};


async function createPendingEmail({
  imo,
  vessel,
  geofenceRef,
  geofenceName,
  geofenceType,
  seaport,
  entryOrExit, // 'entry' or 'exit'
  eventTimestamp,
  toEmails,
  orgRefs,
}) {
  try {
   
    const { LATITUDE, LONGITUDE, NAME } = vessel.AIS || {};
   
    const vesselName = NAME || '';
      console.log('pending email:',imo,vesselName);
    const eventTime = new Date(eventTimestamp);
    const pendingEmailDocs = [];

    const satType = await getSatTypeForVessel(LATITUDE, LONGITUDE);

    // --- Get login users for role checks
    const loginUsers = await LoginUsers.find({ email: { $in: toEmails }, active: true }, { email: 1, role: 1, loginUserId: 1 });

    const hylaOrGuestUsers = loginUsers.filter(u => ['hyla admin', 'guest'].includes(u.role));

    // --- Prepare org-based users
    const orgIntervalPromises = Array.from(orgRefs).map(async orgRef => {
      const intervals = await getInterval('organization', orgRef);
      const interval = intervals[satType];
      if (typeof interval !== 'number' || interval <= 0) {
        console.warn(`Invalid interval value: ${interval} for orgRef: ${orgRef}`);
        return;
      }

      const lastSentAt = await getLastSent({ role: 'organization', loginUserId: null, orgRef, imo });
      const scheduledTime = getScheduledTime(eventTime, lastSentAt, interval);

      const exists = await PendingEmail.exists({
        IMO: imo,
        'geofence.geofenceRef': geofenceRef,
        'geofence.geofenceName': geofenceName,
        'geofence.geofenceType': geofenceType,
        'geofence.seaport': seaport,
        emailType: entryOrExit,
        role: 'organization',
        orgRef,
        eventTimestamp,
        status: 'pending',
      });

      

      if (!exists) {
        pendingEmailDocs.push({
          IMO: imo,
          vesselName,
          geofence: {
            geofenceRef,
            geofenceName,
            geofenceType,
            seaport
          },
          emailType: entryOrExit,
          eventTimestamp,
          role: 'organization',
          orgRef,
          scheduledTime,
          status: 'pending',
        });
      }
    });

     // --- Prepare hyla/guest users
    const userIntervalPromises = hylaOrGuestUsers.map(async user => {
      const intervals = await getInterval(user.role, null);
      const interval = intervals[satType];
      if (typeof interval !== 'number' || interval <= 0) {
        console.warn(`Invalid interval value: ${interval} for role: ${user.role}`);
        return;
      }

      const lastSentAt = await getLastSent({ role: user.role, loginUserId: user.loginUserId, orgRef: null, imo });
      const scheduledTime = getScheduledTime(eventTime, lastSentAt, interval);

      const exists = await PendingEmail.exists({
        IMO: imo,
        'geofence.geofenceRef': geofenceRef,
        'geofence.geofenceName': geofenceName,
        'geofence.geofenceType': geofenceType,
        'geofence.seaport': seaport,
        emailType: entryOrExit,
        role: user.role,
        loginUserId: user.loginUserId,
        orgRef: null,
        eventTimestamp,
        status: 'pending',
      });

      if (!exists) {
        pendingEmailDocs.push({
          IMO: imo,
          vesselName,
          geofence: {
            geofenceRef,
            geofenceName,
            geofenceType,
            seaport
          },
          emailType: entryOrExit,
          eventTimestamp,
          role: user.role,
          loginUserId: user.loginUserId,
          scheduledTime,
          status: 'pending',
        });
      }
    });

    // Wait for all to complete
    await Promise.all([...orgIntervalPromises, ...userIntervalPromises]);
    // Bulk insert if there are any
    if (pendingEmailDocs.length > 0) {
      await PendingEmail.insertMany(pendingEmailDocs, { ordered: false });
    }

  } catch (err) {
    console.error(`Error in createPendingEmail for IMO ${imo}:`, err);
  }
}



// const createPendingEmail = async ({
//   imo,
//   vessel,
//   geofenceRef,
//   geofenceName,
//   geofenceType,
//   entryOrExit, // 'entry' or 'exit'
//   eventTimestamp,
//   seaport,
//   toEmails,
//   orgRefs,
// }) => {
//   try {
//     const now = new Date();

//     for (const email of toEmails) {
//       const emailKey = `${email}_${imo}_${geofenceName}_${entryOrExit}`;
//       const lastLog = await UserEmailLog.findOne({ emailKey });

//       const satpull = await AisSatpull.findOne({ loginEmail: email });
//       const intervalMinutes = satpull?.[`${zoneType}Interval`] || 60;

//       const scheduledTime = getScheduledTime(lastLog?.sentTime, intervalMinutes);

//       await PendingEmail.updateOne(
//         { emailKey },
//         {
//           $set: {
//             email,
//             imo,
//             geofenceName,
//             geofenceType,
//             entryOrExit,
//             scheduledTime,
//             vesselName: vessel?.AIS?.NAME || '',
//             mmsi: vessel?.AIS?.MMSI || '',
//             timestamp: now,
//             seaport,
//             zoneType,
//           }
//         },
//         { upsert: true }
//       );
//     }

//     for (const orgRef of orgRefs) {
//       const emailKey = `${orgRef}_${imo}_${geofenceName}_${entryOrExit}`;
//       const lastLog = await UserEmailLog.findOne({ emailKey });

//       const satpull = await AisSatpull.findOne({ orgRef });
//       const intervalMinutes = satpull?.[`${zoneType}Interval`] || 60;

//       const scheduledTime = getScheduledTime(lastLog?.sentTime, intervalMinutes);

//       await PendingEmail.updateOne(
//         { emailKey },
//         {
//           $set: {
//             orgRef,
//             imo,
//             geofenceName,
//             geofenceType,
//             entryOrExit,
//             scheduledTime,
//             vesselName: vessel?.AIS?.NAME || '',
//             mmsi: vessel?.AIS?.MMSI || '',
//             timestamp: now,
//             seaport,
//             zoneType,
//           }
//         },
//         { upsert: true }
//       );
//     }

//   } catch (err) {
//     console.error('Error creating pending email:', err);
//   }
// };


function normalizeTimestamp(ts) {
  if (!ts) return '';

  // Already ISO string with Z
  if (ts.includes('T') && ts.endsWith('Z')) return ts;

  // Format: "2024-12-10 14:10:06 UTC"
  if (ts.includes(' ') && ts.endsWith(' UTC')) {
    return ts.replace(' ', 'T').replace(' UTC', 'Z');
  }

  // Format: "2024-12-10 14:10:06" (assume UTC)
  if (ts.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return ts.replace(' ', 'T') + 'Z';
  }

  return ts; // As fallback, use it as-is
}









// start



// end

export function checkAisConditions(aisData = {}, conditions = [], logic = "AND") {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return { match: true, passedConditions: [], failedConditions: [] };
  }

  const passedConditions = [];
  const failedConditions = [];

  const evaluate = ({ field, operator, value }) => {
    const config = aisFieldConfig[field];
    if (!config) return false;

    let actual = aisData[field];
    if (actual === undefined || actual === null) return false;

    let result = false;

    switch (config.type) {
      case "number":
        actual = Number(actual);
        if (operator === "between") {
          const start = Number(value?.start);
          const end = Number(value?.end);
          if (isNaN(start) || isNaN(end)) return false;
          result = actual >= start && actual <= end;
        } else {
          value = Number(value);
        }
        break;

      case "boolean":
        actual = actual === true || actual === "true";
        value = value === true || value === "true";
        break;

      case "datetime":
        actual = new Date(actual);
        if (operator === "between") {
          const start = new Date(value?.start);
          const end = new Date(value?.end);
          if (isNaN(start) || isNaN(end)) return false;
          result = actual >= start && actual <= end;
        } else {
          value = new Date(value);
          if (isNaN(value)) return false;
        }
        break;

      default: // string or other types
        actual = String(actual);
        if (operator === "between") {
          const start = String(value?.start);
          const end = String(value?.end);
          result = actual >= start && actual <= end;
        } else {
          value = String(value);
        }
    }

    // If operator is not "between", evaluate here
    if (operator !== "between") {
      switch (operator) {
        case "==": result = actual === value; break;
        case "!=": result = actual !== value; break;
        case ">": result = actual > value; break;
        case "<": result = actual < value; break;
        default: result = false;
      }
    }

    if (result) {
      passedConditions.push({ field, actual, operator, value });
    } else {
      failedConditions.push({ field, actual, operator, value });
    }

    return result;
  };

  const results = conditions.map(evaluate);
  const match = logic === "AND" ? results.every(Boolean) : results.some(Boolean);

  return { match, passedConditions, failedConditions };
}


// AIS-check end 

async function loadGeofence(geofence) {
  const { type, geofenceId } = geofence;
  if (!type || !geofenceId) return null;

  switch (type) {
    case 'Polygon':
      return await PolygonGeofence.findById(geofenceId);
    case 'PolyCircle':
      return await PolyCircleGeofence.findById(geofenceId);
    case 'PolyLine':
      return await PolyLineGeofence.findById(geofenceId);
    default:
      return null;
  }
}

function isInsideGeofence(latitude, longitude, geofence, type) {
  const polygonGeofences = type === 'Polygon' ? [geofence] : [];
  const circleGeofences = type === 'Polycircle' ? [geofence] : [];
  const polylineGeofences = type === 'Polyline' ? [geofence] : [];

  const { isInsideAnyGeofence, geofenceDetails } = checkVesselInGeofences(
    latitude,
    longitude,
    polygonGeofences,
    circleGeofences,
    polylineGeofences
  );

  return { isInside: isInsideAnyGeofence, geofenceDetails };
}

async function checkGeofenceConditions(latitude, longitude, geofence, vessel) {
  const { IMO } = vessel.AIS;
  const geofenceDoc = await loadGeofence(geofence);

  if (!geofenceDoc) return false;

  const { isInside, geofenceDetails } = isInsideGeofence(latitude, longitude, geofenceDoc, geofence.type);
  console.log('isInside',isInside);
  if (!isInside) return false;

  const vesselHistory = await VesselHistory.findOne({ IMO });
  if (!vesselHistory || !Array.isArray(vesselHistory.history)) return false;

  const history = vesselHistory.history;
  const historyLength = history.length;

  if (historyLength === 0) return false;

  const current = history[historyLength - 1];
  const previous = historyLength >= 2 ? history[historyLength - 2] : null;

  const isSameGeofence =
    current.geofenceType === geofence.type &&
    String(current.geofenceRef) === String(geofence.geofenceId);
 
  const wasSameGeofence = previous &&
    previous.geofenceType === geofence.type &&
    String(previous.geofenceRef) === String(geofence.geofenceId);

  console.log('isSameGeofence',isSameGeofence);
  console.log('wasSameGeofence',wasSameGeofence);


  // Handle first-time entry (only one history element)
  const isFirstEntry =
    historyLength === 1 &&
    isSameGeofence &&
    current.entryTime;

  const isEntry =
    !isFirstEntry && isSameGeofence &&
    current.entryTime &&
    (!wasSameGeofence || !previous.entryTime || String(previous.geofenceRef) !== String(geofence.geofenceId));

  const isExit =
    wasSameGeofence &&
    previous.exitTime &&
    (!isSameGeofence || !current.entryTime || previous.entryTime !== current.entryTime );

  console.log('isEntry',isEntry);
  console.log('isExit',isExit);

  return {
    isEntry: isEntry || isFirstEntry,
    isExit,
  };
}

async function createPendingCustomAlertEmails({
  imo,
  vessel,
  alertId,
  alertType,
  vesselName,
  eventTimestamp,
  geofenceData = {},
  aisResult = null,
  userIds = [],
  orgRefs = []
}) {
  try {
    const { LATITUDE, LONGITUDE, NAME } = vessel.AIS || {};
    const satType = await getSatTypeForVessel(LATITUDE, LONGITUDE);
    const pendingEmailDocs = [];

    // 1. Fetch user-level intervals and schedule emails
    const loginUsers = await LoginUsers.find({
      loginUserId: { $in: userIds },
      active: true
    }, { role: 1, loginUserId: 1 });

    const hylaOrGuestUsers = loginUsers.filter(u =>
      ['hyla admin', 'guest'].includes(u.role)
    );

    const userPromises = hylaOrGuestUsers.map(async user => {
      const intervals = await getInterval(user.role, null);
      const interval = intervals[satType];

      if (!interval || typeof interval !== 'number') return;

      const lastSentAt = await getLastSent({
        role: user.role,
        loginUserId: user.loginUserId,
        orgRef: null,
        imo
      });

      const scheduledTime = getScheduledTime(eventTimestamp, lastSentAt, interval);

      // very carefull on duplicates
      // const exists = await PendingCustomAlertEmail.exists({
      //   IMO: imo,
      //   role: user.role,
      //   loginUserId: user.loginUserId,
      //   status: 'pending',
      //   'customAlert.alertId': alertId,
      //   'customAlert.alertType': alertType,
      // });
      //  console.log('exists',!!exists);

      // if (!exists) {
        pendingEmailDocs.push({
          IMO: imo,
          vesselName,
          emailType:'customAlert',
          role: user.role,
          loginUserId: user.loginUserId,
          scheduledTime,
          eventTimestamp,
          status: 'pending',
          customAlert: {
           alertId,
           alertType,
           ais: aisResult?.passedConditions ? { passedConditions: aisResult.passedConditions } : {},
           geofence: geofenceData || {}
          }
        });
      // }
    });

    // 2. Org-level emails
    const orgPromises = orgRefs.map(async orgRef => {
      const intervals = await getInterval('organization', orgRef);
      const interval = intervals[satType];

      if (!interval || typeof interval !== 'number') return;

      const lastSentAt = await getLastSent({
        role: 'organization',
        loginUserId: null,
        orgRef,
        imo
      });

      const scheduledTime = getScheduledTime(eventTimestamp, lastSentAt, interval);

      // very carefull on duplicates
      // const exists = await PendingCustomAlertEmail.exists({
      //   IMO: imo,
      //   role: 'organization',
      //   orgRef,
      //   status: 'pending',
      //   'customAlert.alertId': alertId,
      //   'customAlert.alertType': alertType,
      // });
      //  console.log('exists',!!exists);


      // if (!exists) {
        pendingEmailDocs.push({
          IMO: imo,
          vesselName,
          emailType:'customAlert',
          role: 'organization',
          orgRef,
          scheduledTime,
          eventTimestamp,
          status: 'pending',
          customAlert: {
           alertId,
           alertType,
           ais: aisResult?.passedConditions ? { passedConditions: aisResult.passedConditions } : {},
           geofence: geofenceData || {}
          }
        });
      // }
    });

    await Promise.all([...userPromises, ...orgPromises]);

    if (pendingEmailDocs.length > 0) {
      await PendingCustomAlertEmail.insertMany(pendingEmailDocs, { ordered: false });
      console.log(`Inserted ${pendingEmailDocs.length} pending alert emails for IMO: ${imo}`);
    }

  } catch (err) {
    console.error(`Error in createPendingCustomAlertEmails for IMO ${imo}:`, err);
  }
}


// alert-cron-start

 async function runCustomAlertEvaluation() {

  console.log('alert-cron-running')
    const vesselsToCheck = await TrackedVessel.find({ trackingFlag: true, alertCheckDone: false });
   
    for (const vessel of vesselsToCheck) {
      try {
        const IMO = vessel.AIS.IMO;
        const vesselName = vessel.AIS.NAME || '';
        const { LATITUDE, LONGITUDE, TIMESTAMP } = vessel.AIS;

                // Step 1: Fetch all alerts related to this vessel (IMO)
                const alerts = await Alert.find({
                  isAssigned: true,
                  $or: [
                    { vesselSelectionOption: 'individual', vessels: IMO },
                    { vesselSelectionOption: { $in: ['tracked', 'favorite'] } }
                  ]
                });


                // Step 2: Find who tracks or favorites this vessel
                const trackedVessels = await TrackedVesselByUser.find({ IMO });
                
                // Step 3: Build a map of user/org who tracks/favorites the vessel
                const trackedMap = { users: new Set(), orgs: new Set() };
                const favoriteMap = { users: new Set(), orgs: new Set() };

                trackedVessels.forEach(tv => {
                  const isOrg = !!tv.orgRef;
                  const orgRef = tv.orgRef?.toString();
                  const userId = tv.loginUserId;

                  if (isOrg) trackedMap.orgs.add(orgRef);
                  else trackedMap.users.add(userId);

                  if (tv.favorite) {
                    if (isOrg) favoriteMap.orgs.add(orgRef);
                    else favoriteMap.users.add(userId);
                  }
                });
                console.log('trackedmap',trackedMap);

                
                // Step 4: For each alert, find recipients applicable for this IMO
                
     
          for (const alert of alerts) {
      let applicableRecipients = [];

      const { users = [], organizations = [] } = alert.recipients || {};
                // console.log('users',users);
                // console.log('orgs',organizations);



      switch (alert.vesselSelectionOption) {
        case 'individual':
          applicableRecipients = [...users, ...organizations];
          break;

        case 'tracked':
          applicableRecipients = [
            ...users.filter(u => trackedMap.users.has(u)),
            ...organizations.filter(o => trackedMap.orgs.has(o.toString()))
          ];
          break;

        case 'favorite':
          applicableRecipients = [
            ...users.filter(u => favoriteMap.users.has(u)),
            ...organizations.filter(o => favoriteMap.orgs.has(o.toString()))
          ];
          break;
      }
      console.log(applicableRecipients);
      if (applicableRecipients.length === 0) continue;

      // Check alert conditions
      let aisMatchResult = { match: true, passedConditions: [], failedConditions: [] };
      let geoMatchResult = { isEntry: false, isExit: false };

      if (alert.alertType === 'ais' || alert.alertType === 'both') {
        aisMatchResult = checkAisConditions(vessel.AIS, alert.ais?.conditions || [], alert.ais?.logicalOperator || 'AND');
      }

      if (alert.alertType === 'geofence' || alert.alertType === 'both') {
        geoMatchResult = await checkGeofenceConditions(LATITUDE, LONGITUDE, alert.geofence, vessel);
      }
                console.log('geoMatchResult',geoMatchResult);

      const aisPass = aisMatchResult.match;
      const geoPass = !!(
      geoMatchResult &&
      (geoMatchResult.isEntry === true || geoMatchResult.isExit === true)
      );


                console.log('aisPass',aisPass);
                console.log('geoPass',geoPass);


      let shouldTrigger = false;
      if (alert.alertType === 'ais') shouldTrigger = aisPass;
      if (alert.alertType === 'geofence') shouldTrigger = geoPass;
      if (alert.alertType === 'both') shouldTrigger = aisPass && geoPass;

      if (!shouldTrigger) continue;

            const userRecipients = [];
      const orgRecipients = [];

      applicableRecipients.forEach(recipient => {
        if (typeof recipient === 'string') {
          userRecipients.push(recipient);
        } else {
          orgRecipients.push(recipient); // keep ObjectId as is
        }
      });

        const trackingUsers = await LoginUsers.find({
        $or: [
          { loginUserId: { $in: userRecipients } },
          { orgRef: { $in: orgRecipients } }
        ],
        active: true
      });


      const userIds = new Set();
      const orgRefs = new Set();

      trackingUsers.forEach(user => {
        const { role, loginUserId, orgRef } = user;
        if ((role === 'hyla admin' || role === 'guest') && loginUserId) userIds.add(loginUserId);
        if ((role === 'organization admin' || role === 'organizational user') && orgRef) orgRefs.add(String(orgRef));
      });

      if (userIds.size === 0 && orgRefs.size === 0) continue;

      const entryOrExit = geoMatchResult.isEntry ? 'entry' : geoMatchResult.isExit ? 'exit' : null;
      const normalizedTimeStr = normalizeTimestamp(TIMESTAMP);
      const eventTimestamp = new Date(normalizedTimeStr);

     
        const isGeo = alert.alertType === 'geofence' || alert.alertType === 'both';
        const isAis = alert.alertType === 'ais' || alert.alertType === 'both';

        const geofenceData = isGeo ? {
          entryOrExit,
          geofenceRef: alert.geofence?.geofenceId || null,
          geofenceType: alert.geofence?.type || null
        } : {};

        const aisResult = isAis ? aisMatchResult : null;


         console.log('custom-alert-id:',alert._id);
      console.log('custom-alert-vessel:',IMO);
      console.log('custom-alert-recipents:',userIds,orgRefs);
      console.log('custom-alert-geofence:',geofenceData);
      console.log('custom-alert-ais:',  aisMatchResult );

      await createPendingCustomAlertEmails({
        vessel,
        alertId: alert._id,
        alertType: alert.alertType,
        imo: IMO,
        vesselName,
        eventTimestamp,
        geofenceData,
        aisResult,
        userIds: Array.from(userIds),
        orgRefs: Array.from(orgRefs)
      });
    }


                console.log('updated-imo',vessel.IMO);
                await TrackedVessel.updateOne({ _id: vessel._id }, { alertCheckDone: true });

      } catch (err) {
        console.error(`Error processing vessel IMO ${vessel.AIS.IMO}:`, err);
      }

    }
}


cron.schedule('*/1 * * * *', async () => {
  try {
    await runCustomAlertEvaluation(); // wrap the full code in this function
  } catch (err) {
    console.error("Alert Cron Job Error:", err);
  }
});

// alert-cron-end




// alert end


  app.put(`/api/updateVesselLocation/:IMO`, async (req, res) => {
    const { NAME,MMSI, TIMESTAMP, LATITUDE, LONGITUDE, COURSE, SPEED, HEADING, NAVSTAT, CALLSIGN, TYPE, A, B, C, D, DRAUGHT, DESTINATION, LOCODE, ETA_AIS, ETA, SRC, ZONE, ECA, DISTANCE_REMAINING, ETA_PREDICTED, AIS_EXTRA } = req.body;
    const IMO = req.params.IMO;
   
    try {

      console.log('got into api',IMO);

      const vessel = await TrackedVessel.findOne({ IMO:IMO });
      
       if (!vessel) {
      return res.status(404).json({ message: `Vessel with IMO ${IMO} not found` });
    }
     const vesselllll= { AIS: req.body };
     console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',vesselllll.AIS.NAME);




// Step 1: Get all vessels tracking this IMO
const vesselsByUser = await TrackedVesselByUser.find({ IMO });

// Step 2: Get loginUserIds of those tracking users
const loginUserIds = vesselsByUser.map(v => v.loginUserId);

// Step 3: Get the tracking users with roles and emails
const trackingUsers = await LoginUsers.find({
  loginUserId: { $in: loginUserIds },
  active: true, // optional: skip inactive users
}, { loginUserId: 1, role: 1, email: 1, orgRef: 1 });

    const toEmails = new Set();
    const orgRefs = new Set();

    trackingUsers.forEach(user => {
      const { role, email, orgRef } = user;
      if ((role === 'hyla admin' || role === 'guest') && email) toEmails.add(email.trim());
      if ((role === 'organization admin' || role === 'organizational user') && orgRef) orgRefs.add(orgRef);
    });
    

      const polygonGeofences = await PolygonGeofence.find();
      const circleGeofences = await PolyCircleGeofence.find();
      const polylineGeofences = await PolyLineGeofence.find();
  
      const { isInsideAnyGeofence, geofenceDetails } = checkVesselInGeofences(LATITUDE, LONGITUDE, polygonGeofences, circleGeofences, polylineGeofences);

      let vesselHistory = await VesselHistory.findOne({ IMO });
      let previousHistory = vesselHistory ? vesselHistory.history[vesselHistory.history.length - 1] : null;
  
      const normalizedTimeStr = normalizeTimestamp(TIMESTAMP);
      const eventTime = new Date(normalizedTimeStr);

        if (isNaN(eventTime.getTime())) {
          console.error(`[ERROR] Invalid TIMESTAMP: "${TIMESTAMP}" → Normalized: "${normalizedTimeStr}"`);
          throw new Error(`Invalid eventTimestamp: ${TIMESTAMP}`);
        }


      // Handle entryTime and exitTime
      if (previousHistory) {
        // If vessel is inside the same geofence, keep the previous entryTime
        if (previousHistory.geofenceName === geofenceDetails.geofenceName) {
          geofenceDetails.entryTime = previousHistory.entryTime;
        } 
        
        // If vessel exited the previous geofence, set the exit time
        if (previousHistory.geofenceName && !geofenceDetails.geofenceName) {
          
          previousHistory.exitTime = eventTime;
          geofenceDetails.exitTime = null;

          // Update last element of the array using $set and $position
          await VesselHistory.updateOne(
            { IMO },
            { $set: { [`history.${vesselHistory.history.length - 1}.exitTime`]: eventTime } }
          );

          // Send email for exiting geofence
        // await sendExitEmail(vessel, toEmails, previousHistory.geofenceName);
          console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeexited');
          await createPendingEmail({
          imo: IMO,
          vessel: { AIS: { ...req.body } },
          geofenceRef: previousHistory.geofenceRef || null,
          geofenceName: previousHistory.geofenceName || null,
          geofenceType: previousHistory.geofenceType || null,
          seaport: previousHistory.seaport || null,
          entryOrExit: 'exit',
          eventTimestamp: eventTime,
          toEmails: Array.from(toEmails),
          orgRefs: Array.from(orgRefs),
        });


        }
      }
    
      // Build the history entry
      const historyEntry = {
        AIS: { MMSI, TIMESTAMP, LATITUDE, LONGITUDE, COURSE, SPEED, HEADING, NAVSTAT, CALLSIGN, TYPE, A, B, C, D, DRAUGHT, DESTINATION, LOCODE, ETA_AIS, ETA, SRC, ZONE, ECA, DISTANCE_REMAINING, ETA_PREDICTED},
        AIS_EXTRA,
        LATITUDE,
        LONGITUDE,
        TIMESTAMP,
        ...(isInsideAnyGeofence ? geofenceDetails : { geofenceFlag: 'Outside', exitTime: null })
      };
    
      // changed this to avoid duplications -starts
      // Perform upsert (atomic)
      await VesselHistory.updateOne(
        { IMO: IMO },
        {
          $setOnInsert: {
            vesselName: vessel.AIS.NAME,
            IMO: vessel.AIS.IMO
          },
          $push: { history: historyEntry },
          $currentDate: { updatedAt: true }
        },
        { upsert: true }
      );
      // avoids duplications -ends
  
 
    
      // Check if this is the first time the vessel entered this geofence
      if (!previousHistory || (previousHistory.geofenceName !== geofenceDetails.geofenceName)) {
        if (geofenceDetails.geofenceName) { // Check if geofenceName is defined
            geofenceDetails.entryTime = eventTime;
          
          
            // await sendEntryEmail(vessel, toEmails, geofenceDetails.geofenceName,geofenceDetails.seaport);

          console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeentered');

             await createPendingEmail({
          imo: IMO,
          vessel: { AIS: req.body },
          geofenceRef: geofenceDetails.geofenceRef || null,
          geofenceName: geofenceDetails.geofenceName || null,
          geofenceType: geofenceDetails.geofenceType || null,
          seaport: geofenceDetails.seaport || null,
          entryOrExit: 'entry',
          eventTimestamp:  eventTime,
          toEmails: Array.from(toEmails),
          orgRefs: Array.from(orgRefs),
        });


        }
    }
    

        
    
      // Update TrackedVessel
      await TrackedVessel.findOneAndUpdate({ IMO }, {
        'AIS.LATITUDE': LATITUDE,
        'AIS.LONGITUDE': LONGITUDE,
        'AIS.TIMESTAMP': TIMESTAMP,
        'AIS.COURSE': COURSE,
        'AIS.SPEED': SPEED,
        'AIS.HEADING': HEADING,
        'AIS.NAVSTAT': NAVSTAT,
        'AIS.CALLSIGN': CALLSIGN,
        'AIS.TYPE': TYPE,
        'AIS.A': A,
        'AIS.B': B,
        'AIS.C': C,
        'AIS.D': D,
        'AIS.DRAUGHT': DRAUGHT,
        'AIS.DESTINATION': DESTINATION,
        'AIS.LOCODE': LOCODE,
        'AIS.ETA_AIS': ETA_AIS,
        'AIS.ETA': ETA,
        'AIS.SRC': SRC,
        'AIS.ZONE': ZONE,
        'AIS.ECA': ECA,
        'AIS.DISTANCE_REMAINING': DISTANCE_REMAINING,
        'AIS.ETA_PREDICTED': ETA_PREDICTED,
         AIS_EXTRA,
        'GeofenceStatus': geofenceDetails.geofenceName || null ,
        'geofenceFlag': isInsideAnyGeofence ? geofenceDetails.geofenceFlag : 'Outside',
        // Use geofenceDetails.entryTime (already set correctly) for GeofenceInsideTime
        'GeofenceInsideTime': geofenceDetails.entryTime || null, 
        lastFetchTime: new Date(),
        alertCheckDone: false
      },
      { new: true } // Return the updated document
      );
  
      res.status(200).json({ message: 'Vessel location and history updated successfully' });
    } catch (error) {
      console.error('Error updating vessel location:', error);
      res.status(500).json({ message: 'Error updating vessel location', error });
    }
});



app.put(`/api/updateVesselBufferGeofence/:IMO`, async (req, res) => {
  const {NAME, TIMESTAMP, LATITUDE, LONGITUDE } = req.body;
  const IMO = req.params.IMO;

  try {
   

    

      await VesselBufferGeofence.updateMany(
          { IMO }, 
          {
              $set: {
                  TIMESTAMP,
                  LATITUDE,
                  LONGITUDE
              }
          }
      );

    
      res.status(200).json({ message: 'Vessel buffer geofence updated successfully' });

  } catch (error) {
      console.error('Error updating VesselBufferGeofence:', error);
      res.status(500).json({ message: 'Error updating vessel buffer geofence', error });
  }
});



  
// 17-10-2024-start
// Save vessel history 
// app.post('/api/vesselHistory/:id', async (req, res) => {
//     const { LATITUDE, LONGITUDE, TIMESTAMP, geofenceName, geofenceFlag } = req.body;
//     const vesselName = req.params.id;

//     try {
//         if (!vesselName) {
//             return res.status(400).json({ error: 'Invalid vessel name' });
//         }

//         // Find the vessel history entry for the given vessel name
//         let historyEntry = await VesselHistory.findOne({ vesselName });

//         if (!historyEntry) {
//             // If no history exists, create a new entry
//             historyEntry = new VesselHistory({
//                 vesselName,
//                 history: [{ LATITUDE, LONGITUDE, TIMESTAMP, geofenceName, geofenceFlag }]
//             });
//         } else {
//             // Get the last history object from the array
//             const lastHistory = historyEntry.history[historyEntry.history.length - 1];

//             // Compare both LATITUDE and LONGITUDE with the previous entry
//             const isSameLocation = lastHistory &&
//                 lastHistory.LATITUDE === LATITUDE &&
//                 lastHistory.LONGITUDE === LONGITUDE;

//             // Only add new history entry if the location has changed
//             if (!isSameLocation) {
//                 // Ensure geofenceName and geofenceFlag are not null before adding the entry
//                 if (geofenceName && geofenceFlag) {
//                     historyEntry.history.push({ LATITUDE, LONGITUDE, TIMESTAMP, geofenceName, geofenceFlag });
//                 } else {
//                     return res.status(400).json({ error: 'Missing geofenceName or geofenceFlag' });
//                 }
//             }
//         }

//         // Save the updated history entry
//         await historyEntry.save();
//         res.status(200).json({ message: 'History saved' });
//     } catch (error) {
//         console.error('Error saving vessel history:', error);
//         res.status(500).json({ error: 'Failed to save history' });
//     }
// });


// 17-10-2024-end

// Get vessel history by vessel ID


// app.get('/api/getvesselHistory/:id', async (req, res) => {
//     const vesselId = req.params.id;

//     try {
//         if (!vesselId || !mongoose.isValidObjectId(vesselId)) {
//             return res.status(400).json({ error: 'Invalid vessel ID' });
//         }

//         const historyEntry = await VesselHistory.findOne({ vesselId });

//         if (!historyEntry) {
//             return res.status(404).json({ error: 'History not found for this vessel' });
//         }

//         res.status(200).json(historyEntry);
//     } catch (error) {
//         console.error('Error retrieving vessel history:', error);
//         res.status(500).json({ error: 'Failed to retrieve vessel history' });
//     }
// });

// app.put('/api/updateVesselFlag/:id', async (req, res) => {
//     const { geofenceFlag } = req.body;
//     const vesselId = req.params.id;

//     try {
//         if (!vesselId || !mongoose.isValidObjectId(vesselId)) {
//             return res.status(400).json({ error: 'Invalid vessel ID' });
//         }

//         const vessel = await TrackedVessel.findById(vesselId);
//         if (vessel) {
//             vessel.geofenceFlag = geofenceFlag; // Update the geofenceFlag field
//             await vessel.save();
//             res.status(200).json({ message: 'Geofence flag updated successfully' });
//         } else {
//             res.status(404).json({ error: 'Vessel not found' });
//         }
//     } catch (error) {
//         console.error('Error updating geofence flag:', error);
//         res.status(500).json({ error: 'Failed to update geofence flag' });
//     }
// });




// analytics







// Get items API endpoint (protected by access key)
// 1
app.get('/api/AisSatPull', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await AisSatPull.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

//  2 circle geofence
app.get('/api/Geofence', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await PolyCircleGeofence.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 3

app.get('/api/OpsRadar', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await OpsRadar.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 4
app.get('/api/LoginUsers', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await LoginUsers.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 5
app.get('/api/OpsRadarHistory', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await OpsRadarHistory.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 6
app.get('/api/Organization', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await Organization.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 7
app.get('/api/OrganizationISM', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await OrganizationISM.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 8
app.get('/api/PolygonGeofence', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await PolygonGeofence.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 9
app.get('/api/SalesISM', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await SalesISM.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});


// 10
app.get('/api/SalesRadar', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await SalesRadar.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 11
app.get('/api/TerrestrialGeofence', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await TerrestrialGeofence.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});


// 12
app.get('/api/TrackedVessel', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await TrackedVessel.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});


// 13
app.get('/api/TrackedVesselByUser', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await TrackedVesselByUser.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 14
app.get('/api/TrackedVesselISM', async (req, res) => {

  const accessKey = req.header('x-access-key');
  
if(accessKey == process.env.EXTERNAL_ANALYTICS_ACCESS_KEY){
  try {
    const items = await TrackedVesselISM.find(); // Get all items from the collection
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
else{
  return res.status(403).json({ message: 'Forbidden: Invalid or missing access key' });
}

});

// 15



// chatbot starts

// Environment variable validation
if (!openaiAPI) {
  console.error('Error: Missing OpenAI API key.');
 
 }
 

 // Rate limiter to prevent abuse
 const apiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests. Please try again later.' },
 });
 
 // Middleware for validating incoming queries
 const validateQuery = (req, res, next) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim() === '') {
  return res.status(422).json({ error: 'Query is required and must be a non-empty string.' });
  }
  next();
 };



 // GPT Query Endpoint
//  app.post('/api/gpt-query', apiLimiter, validateQuery, async (req, res) => {
//   try {
//     const { query } = req.body;

//      // Step 1: Get OpenAI API Key from DB
//     const emailOptions = await EmailOptionsTosend.findOne();
//     if (!emailOptions || !emailOptions.openaiApiKey) {
//       return res.status(500).json({ error: 'OpenAI API key not configured.' });
//     }
//     const openaiAPI = emailOptions.openaiApiKey;
    
//     // Fetch all vessels
//     const vessels = await TrackedVessel.find();

//     // Extract relevant vessel data
//     const vesselData = vessels.map(vessel => ({
//       IMO: vessel.IMO,
//       VesselName: vessel.AIS.NAME,
//       Type: vessel.SpireTransportType,
//       MMSI: vessel.AIS.MMSI,
//       Latitude: vessel.AIS.LATITUDE,
//       Longitude: vessel.AIS.LONGITUDE,
//       Timestamp: vessel.AIS.TIMESTAMP,
//       Speed: vessel.AIS.SPEED,
//       Course: vessel.AIS.COURSE,
//       Heading: vessel.AIS.HEADING,
//       NavigationStatus: vessel.AIS.NAVSTAT,
//       Destination: vessel.AIS.DESTINATION,
//       ETA: vessel.AIS.ETA || 'Not Available',
//       Source: vessel.AIS.SRC,
//       Zone: vessel.AIS.ZONE,
//       DistanceRemaining: vessel.AIS.DISTANCE_REMAINING,
//       GrossTonnage: vessel.GrossTonnage || 'Not Available',
//       DeadWeight: vessel.deadWeight || 'Not Available',
//       Flag: vessel.FLAG || 'Not Available',
//       LastFetchTime: vessel.lastFetchTime || 'Not Available',
//       RegionName: vessel.AisPullGfType,
//     }));

//     // Find vessels matching the query
//     const matchingVessels = vesselData.filter(vessel =>
//       query.toLowerCase().includes(vessel.VesselName.toLowerCase()) ||
//       query.includes(vessel.IMO)
//     );

//     let contextMessage = `User's Query: ${query}. Here are the details of the tracking vessels. please give short answers only what user is asking and don't elaborate:\n`;

//     let vesselResponse = [];

//     if (matchingVessels.length > 0) {

//       // If specific vessels are found, return them
//       matchingVessels.forEach((vessel) => {
//         contextMessage += `
//           Name: ${vessel.VesselName},
//           IMO: ${vessel.IMO},
//           Speed: ${vessel.Speed},
//           ETA: ${vessel.ETA},
//           RegionName: ${vessel.RegionName},
//           Type: ${vessel.Type},
//           Latitude: ${vessel.Latitude},
//           Longitude: ${vessel.Longitude},
//           Course: ${vessel.Course},
//           Heading: ${vessel.Heading},
//           NavigationStatus: ${vessel.NavigationStatus},
//           Destination: ${vessel.Destination},
//           Zone: ${vessel.Zone},
//           DistanceRemaining: ${vessel.DistanceRemaining},
//           LastFetchTime: ${vessel.LastFetchTime},
//           Flag: ${vessel.Flag},
//         `;
        
//         vesselResponse.push({
//           text: ``,
//           sender: 'Bot',
//           LocateVesselButtonUrl: {
//             name: vessel.VesselName,
//             imo: vessel.IMO,
//             Speed: vessel.Speed,
//             eta: vessel.ETA,
//             RegionName: vessel.RegionName,
//             SpireTransportType: vessel.Type,
//             lat: vessel.Latitude,
//             lng: vessel.Longitude,
//             Course: vessel.Course,
//             heading: vessel.Heading,
//             NavigationStatus: vessel.NavigationStatus,
//             destination: vessel.Destination,
//             Zone: vessel.Zone,
//             DistanceRemaining: vessel.DistanceRemaining,
//             LastFetchTime: vessel.LastFetchTime
//           }
//         });
//       });
//     } else {

//       // No matching vessels, still return general vessel data but without the button
//       // vesselResponse = [] ;

//       vesselData.forEach((vessel) => {
//         contextMessage += `
//           Name: ${vessel.VesselName},
//           IMO: ${vessel.IMO},
//           Speed: ${vessel.Speed},
//           ETA: ${vessel.ETA},
//           RegionName: ${vessel.RegionName},
//           Type: ${vessel.Type},
//           Latitude: ${vessel.Latitude},
//           Longitude: ${vessel.Longitude},
//           Course: ${vessel.Course},
//           Heading: ${vessel.Heading},
//           NavigationStatus: ${vessel.NavigationStatus},
//           Destination: ${vessel.Destination},
//           Zone: ${vessel.Zone},
//           DistanceRemaining: ${vessel.DistanceRemaining},
//           LastFetchTime: ${vessel.LastFetchTime},
//           Flag: ${vessel.Flag},
//         `;;
//     }
//   );
// }
//     // Send the response to OpenAI and the client
//     const openaiResponse = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: 'gpt-4o-mini',
//         messages: [
//           {
//             role: 'user',
//             content: contextMessage,
//           },
//         ],
//         max_tokens: 200,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${openaiAPI}`,
//         },
//       }
//     );

//     res.status(200).json({
//       response: openaiResponse.data.choices[0].message.content,
//       vesselData: vesselResponse,  // Always send vesselData, even if it's empty
//     });

//   } catch (error) {
//     console.error('Error querying OpenAI API:', error.message);
//     res.status(500).json({ error: 'An error occurred while querying GPT.' });
//   }
// });

const fetchOpenAIResponse = async (messages, openaiAPI) => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model : "gpt-4o-mini",
          messages,

          max_tokens: 400,
          temperature: 0.5,
          top_p: 1
        },
        {
          headers: {
            Authorization: `Bearer ${openaiAPI}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err) {
      if (err.response?.status === 429 && i < maxRetries - 1) {
        const retryAfter = err.response?.headers['retry-after'];
        const delay = retryAfter
          ? Number(retryAfter) * 1000
          : (2 ** i + Math.random()) * 1000;

        console.warn(`Rate limit hit (429). Retrying in ${delay}ms`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
};



app.post('/api/gpt-query', apiLimiter, validateQuery, async (req, res) => {
  try {
    const { query } = req.body;

    // Step 1: Get OpenAI API Key from DB
    const emailOptions = await EmailOptionsTosend.findOne();
    if (!emailOptions || !emailOptions.openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured.' });
    }
    const openaiAPI = emailOptions.openaiApiKey;

    console.log(query);
    console.log(openaiAPI);

 

    // Step 4: Construct messages for OpenAI
const messages = [
  {
    role: 'system',
    content: `You are a maritime assistant that returns ONLY a Markdown table with the following columns:

| Vessel Name |IMO| ETA (UTC) | Departure (UTC) | Voyage Number | Operator |

Strict rules:
- Do NOT include any introductory or closing remarks.
- Do NOT explain anything.
- Only return a Markdown table.
- All timestamps must be in UTC in format: YYYY-MM-DD HH:mm UTC.
- The dates must be within the requested range.
- Use realistic ship names and voyage numbers.`,
  },
  {
    role: 'user',
    content: 'Get me ships arriving at Chennai Port from 26th May 2025 to 30th May 2025.',
  },
];


    // Step 5: Call OpenAI
  const openaiResponse = await fetchOpenAIResponse(messages, openaiAPI);


   

    // Step 7: Send result back
    res.status(200).json({
      response: openaiResponse.data.choices[0].message.content,
      // vesselData: vesselResponse,
    });

  } catch (error) {
    console.error('Error querying OpenAI API:', error.message);
    res.status(500).json({ error: 'An error occurred while querying GPT.' });
  }
});


    app.get('/api/get-tracked-vessels-details', async (req, res) => {
      try {
          
          const vessels = await TrackedVessel.find();
         
          const vesselData = vessels.map(vessel => {
            return {
                IMO: vessel.IMO,
                VesselName: vessel.AIS.NAME,
                ShipName: vessel.AIS.NAME,
                Type: vessel.SpireTransportType,
                MMSI: vessel.AIS.MMSI,
                Latitude: vessel.AIS.LATITUDE,
                Longitude: vessel.AIS.LONGITUDE,
                Timestamp: vessel.AIS.TIMESTAMP,
                Speed: vessel.AIS.SPEED,
                Course: vessel.AIS.COURSE,
                Heading: vessel.AIS.HEADING,
                NavigationStatus: vessel.AIS.NAVSTAT,
                Destination: vessel.AIS.DESTINATION,
                ETA: vessel.AIS.ETA || 'Not Available',
                Source: vessel.AIS.SRC,
                Zone: vessel.AIS.ZONE,
                DistanceRemaining: vessel.AIS.DISTANCE_REMAINING,
                GrossTonnage: vessel.GrossTonnage || 'Not Available',
                DeadWeight: vessel.deadWeight || 'Not Available',
                Flag: vessel.FLAG || 'Not Available',
                LastFetchTime: vessel.lastFetchTime || 'Not Available',
                RegionName: vessel.AisPullGfType,
                
            };
        });

        res.json(vesselData);
      } catch (error) {
          console.error('Error fetching tracked vessels ', error);
          res.status(500).json({ error: 'Error fetching tracked vessels ' });
      }
    });



// chatbot ends


// commented on 13/02/25
// API Endpoint to fetch emission form data


app.get('/api/get-latestAISData-on-submit/:IMO', async (req, res) => {
  const { IMO } = req.params;

  try {
    
    // Fetch latest AIS data (TrackedVessel)
    const latestAISData = await TrackedVessel.findOne({
      // 'AIS.ETA': timeTenderedAt,
      IMO
    });

    if (!latestAISData) {
      return res.status(404).json({ message: 'Latest AIS data not found' });
    }

    // Combine the transport and AIS data
    const responseData = {
      latestAISData: latestAISData.AIS,
    };

    res.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching latestAISData data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/get-ports', async (req, res) => {
  try {
    const ports = await Port.find({});
    res.status(200).json(ports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ports', error });
  }
});

app.get('/api/get-voyages', async (req, res) => {
  try {
    
    // Fetch all voyages
    const voyages = await Voyages.find({});
    if (!voyages.length) {
      return res.status(404).json({ message: 'No voyages found' });
    }

    // Extract unique port names & IMO numbers
    const portNames = [...new Set(voyages.map(v => v.port.toLowerCase()))];
    const imoNumbers = [...new Set(voyages.map(v => v.IMO))];
  

    // Fetch all required data in parallel
    const [ports, masterVessels, trackedVessels] = await Promise.all([
      Port.find({
        $or: portNames.map(name => ({ name: { $regex: `^${name}$`, $options: "i" } }))
      }),
      Vessel.find({ imoNumber: { $in: imoNumbers } }),
      TrackedVessel.find({ IMO: { $in: imoNumbers } })
    ]);
   
    // Convert fetched arrays into lookup objects
    const portMap = new Map(ports.map(port => [port.name.toLowerCase(), port]));
    const masterVesselMap = new Map(masterVessels.map(v => [v.imoNumber, v]));
    const trackedVesselMap = new Map(trackedVessels.map(tv => [tv.IMO, tv]));
   
    const parseAISDate = (rawDate) => {
      if (!rawDate) return null;
    
      // If it's already valid ISO or JS date
      const standardDate = new Date(rawDate);
      if (!isNaN(standardDate)) return standardDate.toISOString();
    
      // Handle custom format: "dd/MM/yy H:mm"
      const [datePart, timePart = '00:00'] = rawDate.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute] = timePart.split(':');
    
      const fullYear = year.length === 2 ? `20${year}` : year;
      const isoDate = new Date(`${fullYear}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00Z`);
      return isNaN(isoDate) ? null : isoDate.toISOString();
    };

    // Map voyages with fetched data
    const mappedVoyages = voyages.map(voyage => {
      const port = portMap.get(voyage.port.toLowerCase());
      const masterVessel = masterVesselMap.get(voyage.IMO);
      const trackedVessel = trackedVesselMap.get(voyage.IMO);


      if (!port || !masterVessel || !trackedVessel) {
        console.warn(`Skipping voyage ${voyage.name} due to missing data`);
        return null; // Mark invalid voyages as null
      }


      return {
        _id: voyage._id,

        VoyageName: voyage.name || null,
        IMO: voyage.IMO || null,
        port,
        AISETA: parseAISDate(trackedVessel.AIS?.ETA) || null, 

        VesselName: trackedVessel.AIS?.NAME || null,
        transport: masterVessel,
        BerthName: voyage.BerthName || null,
        ATB: voyage.ATB || null,
        A_Berth: voyage.A_Berth || null,
        status: voyage.status || null,
        isActive: voyage.isActive|| null
      };
    }).filter(Boolean); // Remove null values


    if (!mappedVoyages.length) {
      return res.status(404).json({ message: 'No valid voyages found' });
    }

    res.status(200).json(mappedVoyages);
  } catch (error) {
    console.error("Error fetching voyages:", error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


// Route to create a new voyage
app.post('/api/create-voyages', async (req, res) => {
  try {
    const { name, port, IMO, ETB, BerthName, ATB, A_Berth, status, isActive, ETA, SPEED } = req.body;

    if (!name || !port || !IMO) {
      return res.status(400).json({ error: "Name, Port, and IMO are required" });
    }


    const newVoyage = new Voyages({
      name,
      port,
      IMO,
      ETB,
      BerthName,
      ATB,
      A_Berth,
      status,
      isActive,
      ETA,
      SPEED
    });

    await newVoyage.save();
    res.status(201).json({ message: "Voyage created successfully", voyage: newVoyage });
  } catch (error) {
    res.status(500).json({ error: "Error creating voyage", details: error.message });
  }
});


// Define the endpoint to calculate the distance
// app.get('/api/distance/:longitude1/:latitude1/:longitude2/:latitude2', async (req, res) => {
//   const { longitude1, latitude1, longitude2, latitude2 } = req.params;

//   // External API URL

//   const url = `https://api.vtexplorer.com/distance?userkey=${userkey}&from=${longitude1},${latitude1}&to=${longitude2},${latitude2}`;

//   try {
//     // Call the external API to get the distance
//     const externalRes = await fetch(url);

//     // Check if the external API responded successfully
//     if (!externalRes.ok) {
//       return res.status(500).json({ message: 'Error fetching distance data from external API' });
//     }

//     // Parse the JSON response from the external API
//     const distanceData = await externalRes.json();

//     // Respond with the fetched distance data
//     res.status(200).json(distanceData);
//   } catch (error) {
//     console.error('Error fetching distance:', error);
//     res.status(500).json({ message: 'Server error while fetching distance', error });
//   }
// });

// Use alert routes


// Endpoint to handle saving the JIT report
app.post('/api/jit-report', async (req, res) => {
  const { reportData } = req.body;
  
  try {
    // Create a new JIT Report instance
    const newReport = new JitReport({
      VoyageId: reportData.VoyageId,
      VoyageName: reportData.VoyageName,
      VesselName: reportData. VesselName,
      port: reportData.port,
      IMO: reportData.IMO,
      CalculatedData: reportData.CalculatedData,
      EmissionData: reportData.EmissionData
      
    });

    // Save the new report to the database
    await newReport.save();

    // Return success response
    res.status(200).json({ message: 'JIT Report saved successfully', reportId: newReport._id });
  } catch (error) {
    console.error('Error saving JIT Report:', error);
    res.status(500).json({ message: 'Failed to save JIT Report', error: error.message });
  }
});

// commented on 13/02/25
// API Endpoint to fetch emission form data
app.get('/api/get-JITreport', async (req, res) => {


  try {
    const data = await JitReport.find(); // Adjust if necessary
        res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching JITreport data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Function to wrap both jobs
const runVesselTrackingJobs = async () => {
  console.log('🕒 Running scheduled vessel maintainance jobs...');
  try {
    await cleanupDuplicateTrackedVessels();
    await checkAndHandleVesselTracking();

    console.log('✅ Vessel maintainance  jobs completed.');
  } catch (err) {
    console.error('❌ Error running scheduled vessel maintainance jobs:', err);
  }
};


// Schedule it to run daily at 1:00 AM

cron.schedule('0 1 * * *', () => {
  
  runVesselTrackingJobs();
});


// Schedule the subscriptionManagementJob to run daily at 1:30 AM
cron.schedule('30 1 * * *', async () => {
  console.log('Running subscription management job at 1 AM daily');
  try {
    await SubscriptionManagement();
  } catch (err) {
    console.error('Subscription management job error:', err);
  }
});



app.get('/api/all-user-roles-dup', async (req, res) => {
  try {
    const loginUsers = await LoginUsers.find().select('-password -alerts -permissions');
    const orgs = await Organization.find();

    // Build quick maps
    const loginUserMap = {};
    for (const lu of loginUsers) {
      loginUserMap[lu.email.trim().toLowerCase()] = lu;
    }

    const userDetailsMap = {};
    for (const u of userDetails) {
      const email = u.userEmail?.trim().toLowerCase();
      if (email) userDetailsMap[email] = u;
    }

    const organizationsMap = {};
    for (const org of orgs) {
      const orgId = org.orgId;
      const adminEmail = org.adminEmail?.trim().toLowerCase();
      const loginUser = loginUserMap[adminEmail];

      const adminObj = {
        userEmail: adminEmail,
        userFirstName: org.adminFirstName || '',
        userLastName: org.adminLastName || '',
        address: org.address || '',
        vesselLimit: loginUser?.vesselLimit ?? null
      };

      organizationsMap[orgId] = {
        ...org._doc,
        organizationalUsers: [],
        organizationAdmin: adminObj
      };
    }

    const guests = [];

    for (const user of loginUsers) {
      const { role, email, loginUserId, vesselLimit } = user;
      if (!email || !loginUserId) continue;

      // Skip hyla admins
      if (role === 'hyla admin') continue;

      const normalizedEmail = email.trim().toLowerCase();
      const orgId = loginUserId.includes('_') ? loginUserId.split('_')[1] : loginUserId.split('_')[0];

      const detailsByEmail = userDetailsMap[normalizedEmail];
      const detailsByOrg = userDetails.find(u => u.orgId === orgId && u.userEmail?.trim().toLowerCase() === normalizedEmail);

      const details = detailsByEmail || detailsByOrg;

      const userObj = {
        userEmail: normalizedEmail,
        userFirstName: details?.userFirstName || '',
        userLastName: details?.userLastName || '',
        address: details?.address || '',
        vesselLimit: vesselLimit ?? null
      };

      if (role === 'organizational user') {
        if (organizationsMap[orgId]) {
          organizationsMap[orgId].organizationalUsers.push(userObj);
        } else {
          console.warn(`⚠️ No organization found for orgId: ${orgId}`);
        }
      } else if (role === 'guest') {
        guests.push(userObj);
      }
    }

    res.json({
      organizations: Object.values(organizationsMap),
      guests
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/all-user-roles', async (req, res) => {
  try {
    const [loginUsers, organizations] = await Promise.all([
      LoginUsers.find().select('-password -alerts -permissions'),
      Organization.find()
    ]);

    const orgById = new Map();
    for (const org of organizations) {
      orgById.set(org._id.toString(), org);
    }

    const organizationsMap = {};
    const guests = [];

    for (const user of loginUsers) {
      const {
        _id,
        role,
        email,
        loginUserId,
        firstName = '',
        lastName = '',
        vesselLimit,
        orgRef
      } = user;

      if (!email || !loginUserId || role === 'hyla admin') continue;

      const normalizedEmail = email.trim().toLowerCase();
      const org = orgRef ? orgById.get(orgRef.toString()) : null;
      const assignShips = org?.assignShips ?? null;

      const userObj = {
        _id,
        userEmail: normalizedEmail,
        userFirstName: firstName,
        userLastName: lastName,
        address: org?.address || '',
        vesselLimit: vesselLimit ?? null,
        assignShips
      };

      if (role === 'organization admin') {
        if (org?.orgId) {
          if (!organizationsMap[org.orgId]) {
            organizationsMap[org.orgId] = {
              _id: org._id,
              ...org._doc,
              organizationAdmin: userObj,
              organizationalUsers: []
            };
          } else {
            organizationsMap[org.orgId].organizationAdmin = userObj;
          }
        }
      } else if (role === 'organizational user') {
        if (org?.orgId) {
          if (!organizationsMap[org.orgId]) {
            organizationsMap[org.orgId] = {
              _id: org._id,
              ...org._doc,
              organizationAdmin: null,
              organizationalUsers: []
            };
          }
          organizationsMap[org.orgId].organizationalUsers.push(userObj);
        }
      } else if (role === 'guest') {
        guests.push(userObj);
      }
    }

    res.json({
      organizations: Object.values(organizationsMap),
      guests
    });

  } catch (err) {
    console.error('Error in /api/all-user-roles:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/update-vessel-limit
router.put('/api/update-vessel-limit', async (req, res) => {
  const { email, vesselLimit } = req.body;

  if (!email || vesselLimit == null) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  try {
    const loginUser = await LoginUsers.findOne({ email });
    if (!loginUser) {
      return res.status(404).json({ success: false, message: 'User not found in loginUsers' });
    }

    const user = await User.findOneAndUpdate(
      { userEmail: email },
      { vesselLimit },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in users collection' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Configuration via environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "123"; // Replace with a secure secret in production
const SUPERSET_HOST = process.env.SUPERSET_HOST || "https://analytics.greenhyla.com";

// Middleware to parse JSON payloads
app.use(express.json());

// POST endpoint to generate the embed URL for a given dashboard
app.post("/api/generate-embed-url", (req, res) => {
  try {
    const { dashboardId } = req.body;

    // Validate input
    if (!dashboardId) {
      return res.status(400).json({ error: "dashboardId is required" });
    }

    // Create the token payload as required by Superset
    const tokenPayload = {
      user: "embedded_user",
      exp: Math.floor(Date.now() / 1000) + 600, // Token expires in 10 minutes
    };

    // Generate the JWT token using the secret
    const token = jwt.sign(tokenPayload, JWT_SECRET);

    // Build the embed URL dynamically based on the Superset host and provided dashboard ID
    const embedUrl = `${SUPERSET_HOST}/superset/dashboard/${dashboardId}/?standalone=true&token=${token}`;

    // Return the URL in the JSON response
    res.json({ url: embedUrl });
  } catch (error) {
    console.error("Error generating embed URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// routes/alertRoutes.js
app.post("/api/alerts/ais-parameter/create", async (req, res) => {
  try {
    const { alertType, createdBy, ais, geofence, recipients, vessels } = req.body;

    if (!alertType || !createdBy?.loginUserId || !createdBy?.email) {
      return res.status(400).json({ message: "Missing required alertType or creator info." });
    }

    const alertData = {
      alertType,
      createdBy,
    };

    // Handle AIS parameters
    if (alertType === "ais" || alertType === "both") {
      if (!ais || !Array.isArray(ais.conditions) || ais.conditions.length === 0) {
        return res.status(400).json({ message: "AIS conditions are required." });
      }

      alertData.ais = {
        conditions: ais.conditions
      };

        // Only include logicalOperator if more than one condition
        if (ais.conditions.length > 1) {
          alertData.ais.logicalOperator = ais.logicalOperator || "OR";
        }
    }

    // Handle geofence
    if (alertType === "geofence" || alertType === "both") {
      if (!geofence?.geofenceId ) {
        return res.status(400).json({ message: "Geofence required." });
      }

      alertData.geofence = {
        geofenceId: geofence.geofenceId,
        geofenceName: geofence.geofenceName,
        
        type: geofence.type || "",
        portUNLOCODE: geofence.portUNLOCODE || null
      };
    }

    // Optional: recipients & vessels
    if (Array.isArray(recipients)) {
      alertData.recipients = recipients;
    }

    if (Array.isArray(vessels)) {
      alertData.vessels = vessels;
    }

    const newAlert = await Alert.create(alertData);
    return res.status(201).json(newAlert);

  } catch (err) {
    console.error("Error creating alert:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// routes/alerts.js
app.get('/api/alerts/ais-parameter', async (req, res) => {
  try {
    const alerts = await Alert.find({}, {
      alertType: 1,
      ais: 1,
      geofence: 1,
      isAssigned: 1,
      createdBy: 1,
    }).lean();

    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('/api/alerts/:id/details', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).lean(); // lean for performance

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // 🧑‍💻 Fetch user recipients using loginUserId instead of populate
    let userRecipients = [];
    if (alert.recipients?.users?.length) {
      userRecipients = await LoginUsers.find({
        loginUserId: { $in: alert.recipients.users },
        active: true
      }).select('loginUserId email').lean();
    }

    // 🏢 Fetch organizations (still using ObjectId)
    let orgRecipients = [];
    if (alert.recipients?.organizations?.length) {
     
      orgRecipients = await Organization.find({
        _id: { $in: alert.recipients.organizations },
        active: true
      }).select('companyTitle').lean();
    }

    // 🚢 Fetch vessel details
    let vesselDetails = [];
    if (alert.vesselSelectionOption === 'individual' && alert.vessels?.length) {
      const TrackedVessel = mongoose.model('vesselstrackeds');
      const vessels = await TrackedVessel.find({
        IMO: { $in: alert.vessels }
      }).select('IMO AIS.NAME').lean();

      vesselDetails = vessels.map(v => ({
        imo: v.IMO,
        name: v.AIS?.NAME || "Unnamed"
      }));
    }

    // ✅ Response
    res.json({
      recipients: {
        users: userRecipients,
        organizations: orgRecipients
      },
      vesselSelectionOption: alert.vesselSelectionOption,
      vesselDetails
    });
  } catch (err) {
    console.error("Error fetching alert details:", err);
    res.status(500).json({ message: err.message });
  }
});





// app.get('/api/alerts/users-emails-for-assigning', async (req, res) => {
//   try {
//     const users = await LoginUsers.find({}, 'email'); // Fetch only the email field
//     const emails = users.map(user => user.email);
//     res.status(200).json(emails); // Return an array of emails
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// PATCH /api/alerts/:id/assign
// Assuming Express app already defined as `app`

// app.patch("/api/alerts/:id/assign", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { vesselSelectionOption, vessels, recipients } = req.body;

//     // Validate vesselSelectionOption
//     const validOptions = ["tracked", "favorite", "individual"];
//     if (!validOptions.includes(vesselSelectionOption)) {
//       return res.status(400).json({ message: "Invalid vessel selection option" });
//     }

//     // If individual vessels selected, vessels array must be non-empty
//     if (vesselSelectionOption === "individual" && (!Array.isArray(vessels) || vessels.length === 0)) {
//       return res.status(400).json({ message: "At least one vessel must be assigned if 'individual' option is selected." });
//     }

//     // Recipients should be an object with optional users and orgs arrays
//     if (
//       !recipients ||
//       (!Array.isArray(recipients.users) && !Array.isArray(recipients.organizations))
//     ) {
//       return res.status(400).json({ message: "Recipients must include users and/or organizations." });
//     }

//     // Find alert by ID
//     const alert = await Alert.findById(id);
//     if (!alert) {
//       return res.status(404).json({ message: "Alert not found" });
//     }

//     // Update alert
//     alert.vesselSelectionOption = vesselSelectionOption;
//     alert.vessels = vessels || [];
//     alert.recipients = {
//       users: recipients.users || [],
//       organizations: recipients.organizations || [],
//     };
//     alert.assignmentStatus = "complete";

//     await alert.save();

//     res.status(200).json({ message: "Alert assigned successfully", alert });

//   } catch (error) {
//     console.error("Error in assigning alert:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// routes/alerts.js
app.post('/api/alerts/assign-alert', async (req, res) => {
  const { alertId, users, organizations, vesselSelectionOption, vessels } = req.body;
  
  console.log(req.body);
  
  if (!['tracked', 'favorite', 'individual'].includes(vesselSelectionOption)) {
    return res.status(400).json({ error: "Invalid vesselSelectionOption" });
  }

  if (vesselSelectionOption === 'individual' && (!vessels || vessels.length === 0)) {
    return res.status(400).json({ error: "Vessels must be provided for 'individual' selection" });
  }

  const update = {
    recipients: {
      users,
      organizations
    },
    vesselSelectionOption,
    vessels: vesselSelectionOption === 'individual' ? vessels : [],
    isAssigned: true
  };

  try {
    await Alert.findByIdAndUpdate(alertId, { $set: update });

    res.json({ success: true });
  } catch (err) {
    console.error("Alert assignment error", err);
    res.status(500).json({ error: "Failed to assign alert" });
  }
});



app.get('/api/alerts/assignable-users-orgs', async (req, res) => {
  try {
    // Users with role 'hyla admin' or 'guest'
    const users = await LoginUsers.find({
      role: { $in: ['hyla admin', 'guest'] }
    }, 'loginUserId email role firstName lastName');

    // All organizations (active only)
    const organizations = await Organization.find({ active: true }, '_id companyName orgId');

    res.status(200).json({ users, organizations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Helper function
async function getVesselsForUserOrOrg(userOrOrgId, isOrg = false) {
  let query;

  if (isOrg) {
    // First fetch the organization to get its orgId
    const org = await Organization.findById(userOrOrgId).select('orgId');
    if (!org) {
      throw new Error('Organization not found');
    }
    query = { OrgId: org.orgId }; // Use the actual orgId stored in tracked vessels
  } else {
    query = { loginUserId: userOrOrgId };
  }

  const trackedVessels = await TrackedVesselByUser.find(query);
  const trackedIMOList = trackedVessels.map(v => v.IMO);

  const vessels = await TrackedVessel.find(
    { IMO: { $in: trackedIMOList } },
    { IMO: 1, 'AIS.NAME': 1 }
  );

  return vessels.map(v => ({
    imo: v.IMO,
    name: v.AIS?.NAME || 'Unnamed',
  }));
}

// POST /api/alerts/assignable-vessels
app.post('/api/alerts/assignable-vessels', async (req, res) => {
  try {
    const { userIds = [], orgIds = [] } = req.body;

    const vesselLists = [];

    for (const userId of userIds) {
      const vessels = await getVesselsForUserOrOrg(userId, false);
      vesselLists.push(vessels);
    }

    for (const orgId of orgIds) {
      const vessels = await getVesselsForUserOrOrg(orgId, true);
      vesselLists.push(vessels);
    }

    if (vesselLists.length === 0) return res.json([]);

    const imoSets = vesselLists.map(list => new Set(list.map(v => v.imo)));
    const commonImos = [...imoSets[0]].filter(imo => imoSets.every(set => set.has(imo)));

    const all = vesselLists.flat();
    const uniqueByImo = new Map(all.map(v => [v.imo, v]));
    const commonVessels = commonImos.map(imo => uniqueByImo.get(imo));

    res.json(commonVessels);
  } catch (err) {
    console.error('Error in assignable-vessels', err);
    res.status(500).json({ error: err.message });
  }
});



// app.get('/api/alerts/vessels-imo-for-assigning', async (req, res) => {
//   try {
//     // Get both IMO and name from AIS
//     const vessels = await TrackedVessel.find({}, { "IMO": 1, "AIS.NAME": 1, _id: 0 });

//     // Map to simpler structure: { imo, name }
//     const vesselIds = vessels.map(v => ({
//       imo: v.IMO,
//       name: v.AIS?.NAME || "Unnamed"
//     }));

//     res.status(200).json(vesselIds);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// app.post('/api/alerts/ais-parameter/:alertId/assign-recipient', async (req, res) => {
//   try {
//     const { alertId } = req.params;
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }

//     const updated = await Alert.findByIdAndUpdate(
//       alertId,
//       { $addToSet: { recipients: email } },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// app.post('/api/alerts/ais-parameter/:alertId/unassign-recipient', async (req, res) => {
//   try {
//     const { alertId } = req.params;
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }

//     const updated = await Alert.findByIdAndUpdate(
//       alertId,
//       { $pull: { recipients: email } },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// app.post('/api/alerts/ais-parameter/:alertId/assign-vessel', async (req, res) => {
//   try {
//     const { alertId } = req.params;
//     const { vessel } = req.body;

//     if (!vessel) {
//       return res.status(400).json({ message: 'Vessel ID is required' });
//     }

//     const updated = await Alert.findByIdAndUpdate(
//       alertId,
//       { $addToSet: { vessels: vessel } },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// app.post('/api/alerts/ais-parameter/:alertId/unassign-vessel', async (req, res) => {
//   try {
//     const { alertId } = req.params;
//     const { vessel } = req.body;

//     if (!vessel) {
//       return res.status(400).json({ message: 'Vessel ID is required' });
//     }

//     const updated = await Alert.findByIdAndUpdate(
//       alertId,
//       { $pull: { vessels: vessel } },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// alerts from 07-05-2025

app.get('/api/alerts/geofences/get-all-geofences-list', async (req, res) => {
  try {
    // , polylines, polycircles
    const [polygons] = await Promise.all([
      PolygonGeofence.find({}),
      // PolyLineGeofence.find({}),
      // PolyCircleGeofence.find({})
    ]);
    //  , ...polylines, ...polycircles
    const all = [...polygons].map(g => ({
      _id: g._id,
      geofenceName: g.geofenceName,
      type: g.type, // Polygon / Polyline / Polycircle
      seaport: g.seaport || null,
    }));

    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch geofences", error: err });
  }

});


app.get('/api/alerts/geofences/get-all-ports-list', async (req, res) => {
  try {
    const ports = await Port.find({ isActive: true });
    res.json(ports);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ports" });
  }

});





// app.use('/api/alert', alertRoutes);

// Routes
app.use('/api/organizations', organizationRoutes);

app.use('/api/ism-organizations', organizationISMRoutes);

// Routes
app.use('/api/users', userRoutes);

// Use the login routes
app.use('/api/signin', loginRoutes);

app.use("/api/permissions", permissionsRoutes);

// Routes
app.use('/api/customfields', customFieldsRoutes);

app.use('/api/settings/users-management', settingsUsers);

app.use('/api/vessel-api', vesselApi);

app.use('/api/expected-arrivals', expectedArrival);

app.use('/api/sea-ports', seaPortsRouter);

app.use('/api/sat-intervals', satIntervals)

app.use('/api/vessel-delete-days', vesselDeleteDays)





// Serve the uploads directory as static
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Start the server and listen on the specified port
app.listen(port,'0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});