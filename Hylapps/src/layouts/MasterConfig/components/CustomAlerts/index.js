import React, { useEffect, useState, useCallback } from "react";
import { aisFieldConfig, conditionOperators } from "./AisConstants";
import AlertModal from "./AlertModal";
import axios from 'axios';
import { useContext } from "react";
import { AuthContext } from "../../../../AuthContext";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Stack,
  Grid,
  useTheme,
  Box,
  Card,
  Fade,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // for alert icon
import GpsFixedIcon from '@mui/icons-material/GpsFixed'; // for geofence icon
import TuneIcon from '@mui/icons-material/Tune';  // for AIS icon
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Popover, List, ListItem, ListItemText, Divider } from "@mui/material";
import PropTypes from 'prop-types';
import { Autocomplete } from '@mui/material';
import SearchableSelect from "./SearchableSelect";

import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify'; // ✅ if you're using react-toastify
import 'react-toastify/dist/ReactToastify.css';
import AssignVesselsRecipients from "./AssignVesselsRecipients";


const CustomAlerts = () => {
    const { id,role, loginEmail } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [modalOpenForAlert, setModalOpenForAlert] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [expandedAlert, setExpandedAlert] = useState(null);
    const [alertDetails, setAlertDetails] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [emails, setEmails] = useState([]);
    const [vesselIds, setVesselIds] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState({});
    const [selectedVessel, setSelectedVessel] = useState({});


    const [anchorElEmail, setAnchorElEmail] = useState({});
    const [anchorElVessel, setAnchorElVessel] = useState({});
    
   
    const [formErrors, setFormErrors] = useState({});
    const [alertType, setAlertType] = useState("ais"); // default to "ais"
   
    const [aisConditions, setAisConditions] = useState([
      { field: "", operator: "", value: "" }
    ]);
    const [logicalOperator, setLogicalOperator] = useState("OR");

   
   
  
    const [selectedGeofence, setSelectedGeofence] = useState("");
    const [selectedPort, setSelectedPort] = useState("");
    const [geofences, setGeofences] = useState([]);
    const [ports, setPorts] = useState([]);
    

    const updateCondition = (index, key, newValue) => {
      setAisConditions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [key]: newValue,
        };
    
        // Auto-initialize value for "between" operator
        if (key === "operator" && newValue === "between") {
          updated[index].value = { start: "", end: "" };
        }
    
        return updated;
      });
    };
    
    
    const addCondition = () => {
      setAisConditions((prev) => [...prev, { field: "", operator: "", value: "" }]);
    };
    
    const removeCondition = (index) => {
      setAisConditions((prev) => prev.filter((_, i) => i !== index));
    };
    
    
  const getVesselDisplayName = (imo) => {
    const vesselObj = vesselIds.find(v => String(v.imo) === String(imo));
    return vesselObj ? `${vesselObj.imo} - ${vesselObj.name}` : imo;
  };
  

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_BASE_URL;
        const res = await fetch(`${baseURL}/api/alerts/ais-parameter`);
        if (!res.ok) {
          throw new Error("Failed to fetch alerts");
        }
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        alert(`Error fetching alerts: ${err.message}`);
      }
    };
    fetchAlerts();
  }, []);

  const handleAssigned = (alertId) => {
  setAlerts(prev =>
    prev.map(alert =>
      alert._id === alertId ? { ...alert, isAssigned: true } : alert
    )
  );
};


  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;

    const fetchData = async () => {
      const geofRes = await axios.get(`${baseURL}/api/alerts/geofences/get-all-geofences-list`);
      setGeofences(geofRes.data);
  
      const portRes = await axios.get(`${baseURL}/api/alerts/geofences/get-all-ports-list`);
      setPorts(portRes.data);
    };
  
    fetchData();
  }, []);
  

  // useEffect(() => {
  //   // Fetching available emails for assignment
  //   const fetchEmails = async () => {
  //     try {
  //       const baseURL = process.env.REACT_APP_API_BASE_URL;
  //       const res = await fetch(`${baseURL}/api/alerts/users-emails-for-assigning`);
  //       if (!res.ok) {
  //         throw new Error("Failed to fetch users");
  //       }
  //       const data = await res.json();
  //       setEmails(data); // Store the emails
  //     } catch (err) {
  //       alert(`Error fetching emails: ${err.message}`);
  //     }
  //   };

  //   // Fetching available vessels for assignment
  //   const fetchVessels = async () => {
  //     try {
  //       const baseURL = process.env.REACT_APP_API_BASE_URL;
  //       const res = await fetch(`${baseURL}/api/alerts/vessels-imo-for-assigning`);
  //       if (!res.ok) {
  //         throw new Error("Failed to fetch vessels");
  //       }
  //       const data = await res.json();
  //       setVesselIds(data); // Store the vessel IDs (IMO)
  //     } catch (err) {
  //       alert(`Error fetching vessels: ${err.message}`);
  //     }
  //   };

  //   fetchEmails();
  //   fetchVessels();
  // }, []);

  const isFormValid = () => {
    const aisValid = aisConditions.every((c) => {
      if (!c.field || !c.operator) return false;
  
      const config = aisFieldConfig[c.field];
      if (config?.type === "datetime" && c.operator === "between") {
        return c.value?.start && c.value?.end;
      }
  
      return c.value !== "" && c.value !== null && c.value !== undefined;
    });
  
    const geofenceValid =
      selectedGeofence 
      // &&
      // (associatedPort || (selectedPort && alertType !== "geofence"));
  
    if (alertType === "ais") return aisValid;
    if (alertType === "geofence") return geofenceValid;
    if (alertType === "both") return aisValid && geofenceValid;
  
    return false;
  };
  
  
  const resetFormState = useCallback(() => {


    
    setAisConditions([{ field: "", operator: "", value: "" }]);
    setLogicalOperator("OR");
    setSelectedGeofence("");
    setSelectedPort("");
    setFormErrors({});
  }, []);
  
  
  const handleAddAlert = async () => {
    if (!isFormValid()) {
      // Update form errors to display them
      const errors = {};
  
      // AIS conditions validation
      aisConditions.forEach((cond, index) => {
        const config = aisFieldConfig[cond.field];
        const isBetween = cond.operator === "between";
      
        const missing =
          !cond.field ||
          !cond.operator ||
          (isBetween
            ? !cond.value?.start || !cond.value?.end
            : cond.value === "" || cond.value === null || cond.value === undefined);
      
        if (missing) {
          errors.aisConditions = errors.aisConditions || [];
          errors.aisConditions[index] = "Please complete all fields for the AIS condition.";
        }
      });
      
  
      // Geofence validation
      if (!selectedGeofence) {
        errors.geofence = "Please select a geofence.";
      }
      if (alertType !== "ais" && !associatedPort && !selectedPort) {
        errors.port = "Please select a port.";
      }
  
      setFormErrors(errors);
      return;
    }
  
    // Proceed with adding alert
    const formattedAisConditions = aisConditions.map((cond) => {
      const config = aisFieldConfig[cond.field];
      let formattedValue = cond.value;
      console.log('date.......',cond.value);
  
      if (config?.type === "datetime") {
        if (cond.operator === "between") {
         
        const start = cond.value?.start;
        const end = cond.value?.end;
        console.log('date.......',cond.value);
          if (start && end) {
            formattedValue = {
                  start: cond.value?.start ? cond.value.start + ":00" : null,
                  end: cond.value?.end ? cond.value.end + ":00" : null,
            };
          } else {
              formattedValue =  null;
          }
        }
         else {
          formattedValue = cond.value ? cond.value + ":00" : null;
        }
      } else if (config?.type === "number") {
        formattedValue = Number(cond.value);
      } else if (config?.type === "boolean") {
        formattedValue = cond.value === "true";
      }
  
      return {
        field: cond.field,
        operator: cond.operator,
        value: formattedValue,
      };
    });
  
    // Get geofence and port info
    const geofenceObj = geofences.find(g => g._id === selectedGeofence);
    const port = geofenceObj?.seaport
      ? ports.find(p =>
          p.name.toLowerCase() === geofenceObj.seaport.toLowerCase() ||
          p.UNLOCODE.toLowerCase() === geofenceObj.seaport.toLowerCase()
        )
      : ports.find(p => p.UNLOCODE === selectedPort);
  
    const payload = {
      alertType,
      createdBy: {
        loginUserId: id,
        email: loginEmail,
      },
      ...(alertType === "ais" || alertType === "both"
        ? {
            ais: {
              conditions: formattedAisConditions,
              logicalOperator,
            },
          }
        : {}),
      ...(alertType === "geofence" || alertType === "both"
        ? {
            geofence: {
              geofenceId: selectedGeofence,
              geofenceName: geofenceObj?.geofenceName || "",
              
              type: geofenceObj?.type || "",
              portUNLOCODE: port?.UNLOCODE || "",
            },
          }
        : {}),
    };
  
    try {
      const baseURL = process.env.REACT_APP_API_BASE_URL;

      console.log(payload);
      const res = await fetch(`${baseURL}/api/alerts/ais-parameter/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
  

      const newAlert = await res.json();
      setAlerts((prev) => [...prev, newAlert]);
  
      // Reset form state
      resetFormState();
      toast.success("Alert created successfully!");

        setModalOpen(false);

      
       
    
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  


  

  // const handleAssignDetails = async (alertId, email = null, vessel = null) => {
  //   if (!email && !vessel) return;
  
  //   try {
  //     const baseURL = process.env.REACT_APP_API_BASE_URL;
  
  //     if (email) {
  //       const res = await fetch(`${baseURL}/api/alerts/ais-parameter/${alertId}/assign-recipient`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ email }),
  //       });
  
  //       if (!res.ok) {
  //         const err = await res.json();
  //         throw new Error(err.message);
  //       }
  //     }
  
  //     if (vessel) {
  //       const res = await fetch(`${baseURL}/api/alerts/ais-parameter/${alertId}/assign-vessel`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ vessel }),
  //       });
  
  //       if (!res.ok) {
  //         const err = await res.json();
  //         throw new Error(err.message);
  //       }
  //     }
  
  //     // Fetch updated alert from backend
  //     const updatedRes = await fetch(`${baseURL}/api/alerts/ais-parameter`);
  //     const updatedData = await updatedRes.json();
  //     setAlerts(updatedData);
  
  //   } catch (err) {
  //     toast.error(`Error: ${err.message}`);
  //   }
  // };
  
  
  // const handleUnassign = async (alertId, email = null, vessel = null) => {
  //   try {
  //     const baseURL = process.env.REACT_APP_API_BASE_URL;
  
  //     if (email) {
  //       const res = await fetch(`${baseURL}/api/alerts/ais-parameter/${alertId}/unassign-recipient`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ email }),
  //       });
  
  //       if (!res.ok) {
  //         const err = await res.json();
  //         throw new Error(err.message);
  //       }
  //     }
  
  //     if (vessel) {
  //       const res = await fetch(`${baseURL}/api/alerts/ais-parameter/${alertId}/unassign-vessel`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ vessel }),
  //       });
  
  //       if (!res.ok) {
  //         const err = await res.json();
  //         throw new Error(err.message);
  //       }
  //     }
  
  //     // Refresh the alerts list
  //     const updatedRes = await fetch(`${baseURL}/api/alerts/ais-parameter`);
  //     const updatedData = await updatedRes.json();
  //     setAlerts(updatedData);
  
  //   } catch (err) {
  //     toast.error(`Error: ${err.message}`);
  //   }
  // };

//   const handleAssignDetails = async (alertId, email, imo) => {
//   try {
//     const baseURL = process.env.REACT_APP_API_BASE_URL;

//     // Prepare updated lists
//     const alert = alerts.find((a) => a._id === alertId);
//     if (!alert) return;

//     // Clone existing arrays or empty
//     const updatedRecipients = [...(alert.recipients || [])];
//     const updatedVessels = [...(alert.vessels || [])];

//     if (email) {
//       if (!updatedRecipients.includes(email)) {
//         updatedRecipients.push(email);
//       }
//     }
//     if (imo) {
//       if (!updatedVessels.includes(imo)) {
//         updatedVessels.push(imo);
//       }
//     }

//     // PATCH to update alert with new recipients/vessels
//     const res = await fetch(`${baseURL}/api/alerts/${alertId}/assign`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         // For simplicity assuming individual vessels and recipients here
//         vesselSelectionOption: "individual",
//         vessels: updatedVessels,
//         recipients: {
//           users: updatedRecipients,
//           organizations: alert.recipientsOrganizations || [], // handle orgs if any
//         },
//       }),
//     });

//     if (!res.ok) {
//       const err = await res.json();
//       throw new Error(err.message);
//     }

//     const updatedAlert = await res.json();

//     // Update local state with updated alert
//     setAlerts((prev) =>
//       prev.map((a) => (a._id === alertId ? updatedAlert.alert : a))
//     );
//   } catch (err) {
//     alert(`Error assigning: ${err.message}`);
//   }
// };

const handleUnassign = async (alertId, email, imo) => {
  try {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    const alert = alerts.find((a) => a._id === alertId);
    if (!alert) return;

    let updatedRecipients = [...(alert.recipients || [])];
    let updatedVessels = [...(alert.vessels || [])];

    if (email) {
      updatedRecipients = updatedRecipients.filter((e) => e !== email);
    }
    if (imo) {
      updatedVessels = updatedVessels.filter((v) => v !== imo);
    }

    const res = await fetch(`${baseURL}/api/alerts/${alertId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vesselSelectionOption: "individual",
        vessels: updatedVessels,
        recipients: {
          users: updatedRecipients,
          organizations: alert.recipientsOrganizations || [],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    const updatedAlert = await res.json();

    setAlerts((prev) =>
      prev.map((a) => (a._id === alertId ? updatedAlert.alert : a))
    );
  } catch (err) {
    alert(`Error unassigning: ${err.message}`);
  }
};

  

  
  const getApplicableOperators = (field) => {
    if (!field || !aisFieldConfig[field]) return [];

    const config = aisFieldConfig[field];
    if (config.type === "boolean") return [{ label: "Equals", value: "==" }];
    if (config.type === "datetime") {
      return [
        { label: "Equals", value: "==" },
        { label: "Before", value: "<" },
        { label: "After", value: ">" },
        { label: "Between", value: "between" },
      ];
    }
    return conditionOperators;
  };

  const formatDateTimeLocal = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return ""; // Invalid date
    return d.toISOString().slice(0, 16); // Remove seconds and 'Z'
  };

  
  const renderValueInput = (selectedField, selectedOperator, value, onChange) => {
    if (!onChange) {
      console.error("onChange is not defined!");
      return null;
    }
    
    if (!selectedField) return null;
    const config = aisFieldConfig[selectedField];
    if (!config) return null;

    if (config.type === "select") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select</option>
          {config.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value} - {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (config.type === "boolean") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select</option>
          <option value="true">True (ECA)</option>
          <option value="false">False (SECA)</option>
        </select>
      );
    }

    if (config.type === "datetime") {
      if (selectedOperator === "between") {
        
        return (
          <>
            <input
              type="datetime-local"
              value={value?.start}
              onChange={(e) => {
                onChange({ ...value, start: e.target.value });
              }}
              
            />
            <span style={{ margin: "0 5px" }}>to</span>
            <input
          type="datetime-local"
          value={value?.end}
          onChange={(e) => {
            onChange({ ...value, end: e.target.value });
          }}
        />
          </>
        );
      }
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.blur(); 
            }  }
        />
      );
    }

    const inputType = config.type === "number" ? "number" : "text";
    return (
      <input
        type={inputType}
        placeholder="Enter value"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  const handleExpand = async (alertId) => {
        const baseURL = process.env.REACT_APP_API_BASE_URL;

    const isExpanded = expandedAlert === alertId;
    setExpandedAlert(isExpanded ? null : alertId);

    if (!isExpanded && !alertDetails[alertId]) {
      try {
        const res = await fetch(`${baseURL}/api/alerts/${alertId}/details`);
        const data = await res.json();
        console.log('alert-expand',data);
        setAlertDetails(prev => ({ ...prev, [alertId]: data }));
      } catch (err) {
        console.error("Error loading alert details:", err);
      }
    }
  };




  const selectedGeofenceObj = geofences.find(g => g._id === selectedGeofence);

const associatedPort = selectedGeofenceObj?.seaport
  ? ports.find(
      (p) =>
        p.name.toLowerCase() === selectedGeofenceObj.seaport.toLowerCase() ||
        p.UNLOCODE.toLowerCase() === selectedGeofenceObj.seaport.toLowerCase()
    )
  : null;

   const formatAISConditions = (conditions, logicOp) => {
  if (!conditions || conditions.length === 0) return null;

  return conditions.map((cond, i) => {
    const val = cond.operator === 'between'
      ? `${new Date(cond.value.start).toLocaleString()} → ${new Date(cond.value.end).toLocaleString()}`
      : cond.value;

    return (
      <React.Fragment key={i}>
        {i > 0 && <span style={{ margin: '0 4px', fontWeight: 'bold' }}>{logicOp}</span>}
        <strong>{cond.field}</strong> {cond.operator} <em>{val}</em>
      </React.Fragment>
    );
  });
};



  return (
    <Card
  elevation={3}
  sx={{
    borderRadius: 3,
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    p: { xs: 2, md: 3 }

  }}
>

   <AssignVesselsRecipients
        alertId={modalOpenForAlert}
        open={modalOpenForAlert !== null}
        onClose={() => setModalOpenForAlert(null)}
        onAssigned={handleAssigned}
      />

<Box sx={{ p: 2 }}>
  <Box sx={{
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 2,
  }}>
  <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }} > Alerts On AIS Parameters </Typography>
  <Button
    variant="contained"
    onClick={() => setModalOpen(true)}
    sx={{
      color: " #F1F6F9",
      backgroundColor: " #115293",
      textTransform: "none",
      fontWeight: 500,
      "&:hover": {
        backgroundColor: " #1976d2",
      },
    }}
  >
    Create Alert&nbsp;<i className="fa-solid fa-bell"></i>
  </Button>
</Box>



<AlertModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddAlert}>
      <div className="modal-header">
        <h2>Create Alert</h2>
      </div>

      <div className="form-section">
      
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="alertType"
              value="ais"
              checked={alertType === "ais"}
              onChange={() => setAlertType("ais")}
            />
            AIS Parameter
          </label>
          <label>
            <input
              type="radio"
              name="alertType"
              value="geofence"
              checked={alertType === "geofence"}
              onChange={() => setAlertType("geofence")}
            />
            Geofence
          </label>
          <label>
            <input
              type="radio"
              name="alertType"
              value="both"
              checked={alertType === "both"}
              onChange={() => setAlertType("both")}
            />
            AIS + Geofence
          </label>
        </div>
      </div>

    {/* AIS Parameters Section */}
    {(alertType === "ais" || alertType === "both") && (
  <div className={`ais-parameters-section ${alertType === "both" ? "grouped-section" : ""}`}>
    {/* <h4 className="section-title">AIS Parameters</h4> */}

    {aisConditions.map((condition, index) => (
      
      <div key={index} className="parameter-card-with-logic">
        <div className="parameter-card">
          <label>Select AIS Field</label>
          <select
            value={condition.field}
            onChange={(e) => updateCondition(index, "field", e.target.value)}
          >
            <option value="">Select AIS Field</option>
            {Object.keys(aisFieldConfig).map((field) => (
              <option key={field} value={field}>
                {aisFieldConfig[field].label}
              </option>
            ))}
          </select>
         

          <label>Condition</label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, "operator", e.target.value)}
            disabled={!condition.field}
          >
            <option value="">Select Condition</option>
            {getApplicableOperators(condition.field).map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {renderValueInput(
            condition.field,
            condition.operator,
            condition.value,
            (val) => updateCondition(index, "value", val)
          )}

          {aisConditions.length > 1 && (
            <span
              className="remove-condition-btn"
              onClick={() => removeCondition(index)}
            >
              ✕
            </span>
          )}
        </div>

        {index < aisConditions.length - 1 && (
          <div className="operator-toggle">
            <button
              className={`toggle-btn ${logicalOperator === "OR" ? "active" : ""}`}
              onClick={() => setLogicalOperator("OR")}
            >
              OR
            </button>
            <button
              className={`toggle-btn ${logicalOperator === "AND" ? "active" : ""}`}
              onClick={() => setLogicalOperator("AND")}
            >
              AND
            </button>
          </div>
        )}
      </div>
    ))}

    <div className="add-condition-btn" onClick={addCondition}>
      + Add Another AIS Parameter
    </div>
  </div>
)}



    {/* Geofence Section */}
{(alertType === "geofence" || alertType === "both") && (
  <div className="geofence-section">
    <div className="parameter-card">
      <label>Select Geofence</label>
      <SearchableSelect
        options={geofences}
        value={selectedGeofence}
        onChange={setSelectedGeofence}
        placeholder="Search geofences..."
        getOptionLabel={(g) => `${g.geofenceName} (${g.seaport}) - ${g.type}`}
      />
      {formErrors.geofence && <span className="error-msg">{formErrors.geofence}</span>}

      {associatedPort ? (
        <>
          <label>Associated Port</label>
          <div className="readonly-text">
            {associatedPort.name} ({associatedPort.UNLOCODE})
          </div>
        </>
      ) : (
        <>
          <label>Select Port</label>
          <SearchableSelect
            options={ports}
            value={selectedPort}
            onChange={setSelectedPort}
            placeholder="Search ports..."
            getOptionLabel={(p) => `${p.name} (${p.UNLOCODE})`}
          />
          {formErrors.port && <span className="error-msg">{formErrors.port}</span>}
        </>
      )}
    </div>
  </div>
)}


      <div className="button-row">
        <button className="button-primary" onClick={handleAddAlert} disabled={!isFormValid()}>
          Save Alert
        </button>

        <button className="button-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
      </div>
</AlertModal>




   {alerts.length === 0 ? (
  <Typography>No alerts found.</Typography>
) : (
  <Box display="flex" flexDirection="column" gap={0.4}>
    {alerts.map(alert => {
      const isAssigned = alert.isAssigned;
      const isExpanded = expandedAlert === alert._id;
      const details = alertDetails[alert._id] || {};
      const ais = alert.ais;
      const geo = alert.geofence;

      return (
       <Accordion
  key={alert._id}
  expanded={isAssigned && isExpanded}
  onChange={() => { if (isAssigned) handleExpand(alert._id); }}
  disableGutters
  sx={{
    borderRadius: 2,
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgb(0 0 0 / 0.08)',
    mb: 1,
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
    },
    '&:before': { display: 'none' }
  }}
>
<AccordionSummary
  expandIcon={isAssigned ? <ExpandMoreIcon color="primary" /> : null}
  sx={{
    cursor: isAssigned ? 'pointer' : 'default',
    py: 2,
    px: 3,
    position: 'relative',
    '& .MuiAccordionSummary-content': {
      margin: 0,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    },
  }}
>
  {/* Top Row: AIS & Geofence + Status Badge aligned to end */}
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="flex-start"
    px={1}
    flexWrap="nowrap"
  >
    {/* Left: AIS + Geofence */}
    <Box display="flex" flexDirection="column" gap={1} flex={1} minWidth={0}>
      {ais?.conditions?.length > 0 && (
        <Box display="flex" alignItems="center" gap={0.75} sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          <TuneIcon fontSize="small" color="action" />
          <Box sx={{ fontWeight: 500, overflowWrap: 'break-word' }}>
            <strong>AIS:</strong> {formatAISConditions(ais.conditions, ais.logicalOperator)}
          </Box>
        </Box>
      )}
      {geo?.geofenceId && (
        <Box display="flex" alignItems="center" gap={0.75} sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          <GpsFixedIcon fontSize="small" color="action" />
          <Box sx={{ fontWeight: 500, overflowWrap: 'break-word' }}>
            <strong>Geofence:</strong> {geo.geofenceName} ({geo.type}{geo.portUNLOCODE ? ` - ${geo.portUNLOCODE}` : ''})
          </Box>
        </Box>
      )}
    </Box>

    {/* Right: Status Badge with fixed width for perfect alignment */}
    <Box
      sx={{
        flexShrink: 0,
        minWidth: '120px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '12px',
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          backgroundColor: isAssigned ? '#e8f5e9' : '#ffebee',
          color: isAssigned ? '#2e7d32' : '#c62828',
          lineHeight: 1,
        }}
      >
        <Box component="span" sx={{ fontSize: '10px', mr: '4px', lineHeight: 0 }}>
          ●
        </Box>
        {isAssigned ? 'Assigned' : 'Not Assigned'}
      </Box>
    </Box>
  </Box>

  {/* Bottom Row: Created By & Assign Button */}
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    px={1}
    mt={1.5}
    flexWrap="nowrap"
    gap={2}
  >
    {/* Created by */}
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexGrow: 1,
      }}
      title={`Created by: ${alert.createdBy.email}`}
    >
      Created by: {alert.createdBy.email}
    </Typography>

    {/* Assign button — clean, pill, subtle */}
    {!isAssigned && (
      <Button
        variant="outlined"
        size="small"
        onClick={() => setModalOpenForAlert(alert._id)}
        sx={{
          textTransform: 'none',
          fontSize: '0.75rem',
          padding: '4px 12px',
          borderRadius: '20px',
          borderColor: '#1976d2',
          color: '#1976d2',
          '&:hover': {
            backgroundColor: '#f0f7ff',
            borderColor: '#115293',
          },
        }}
      >
        Assign
      </Button>
    )}
  </Box>
</AccordionSummary>


  {isAssigned && (
<AccordionDetails sx={{ backgroundColor: '#f9fbfc', px: 3, py: 2 }}>
  <Stack spacing={2}>
    {/* Recipients */}
    <Box
      sx={{
        backgroundColor: 'rgb(245, 245, 245)',
        // border: '1px solid #ddd',
        borderRadius: 2,
        px: 2,
        py: 1.5,
        boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.04)',
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <PersonIcon fontSize="small" color="primary" sx={{ mr: 0.75 }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Recipients
        </Typography>
      </Box>

      {/* Users */}
      {details.recipients?.users?.length > 0 && (
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
          <Typography variant="body2" fontWeight="500" sx={{ whiteSpace: 'nowrap' }}>Users:</Typography>
          {details.recipients.users.map((user, i) => (
            <Chip
              key={i}
              label={user.email}
              color="info"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          ))}
        </Box>
      )}

      {/* Organizations */}
      {details.recipients?.organizations?.length > 0 && (
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="body2" fontWeight="500" sx={{ whiteSpace: 'nowrap' }}>Organizations:</Typography>
          {details.recipients.organizations.map((org, i) => (
            <Chip
              key={i}
              label={org.companyTitle}
              color="info"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          ))}
        </Box>
      )}

      {/* No recipients */}
      {!details.recipients?.users?.length &&
        !details.recipients?.organizations?.length && (
          <Typography variant="body2" color="text.disabled">
            No recipients assigned
          </Typography>
        )}
    </Box>

    {/* Vessels */}
    <Box
      sx={{
        backgroundColor: 'rgb(245, 245, 245)',
        // border: '1px solid #ddd ',
        borderRadius: 2,
        px: 2,
        py: 1.5,
        boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.04)',
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <DirectionsBoatIcon fontSize="small" color="info" sx={{ mr: 0.75 }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Vessels
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={details.vesselSelectionOption === 'individual' ? 1 : 0}>
        <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: 'nowrap' }}>
          Type:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {{
            tracked: 'Tracking Vessels',
            favorite: 'Favorite Vessels',
            individual: 'Specific Vessels'
          }[details.vesselSelectionOption] || details.vesselSelectionOption}
        </Typography>
      </Box>

      {details.vesselSelectionOption === 'individual' ? (
        details.vesselDetails?.length > 0 ? (
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="body2" fontWeight="500" sx={{ whiteSpace: 'nowrap' }}>Vessels:</Typography>
            {details.vesselDetails.map((v, i) => (
              <Chip
                key={i}
                label={`${v.name} (${v.imo})`}
                color="info"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">
            No vessels assigned
          </Typography>
        )
      ) : null}
    </Box>
  </Stack>
</AccordionDetails>


  )}
</Accordion>
      );
    })}
  </Box>
)}




  </Box>
    </Card>
  );
};

export default CustomAlerts;