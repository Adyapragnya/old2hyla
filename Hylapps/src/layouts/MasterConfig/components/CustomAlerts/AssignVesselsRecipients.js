import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import MultiSelectDropdown from "./MultiSelectDropdown"; // your dropdown component
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./AssignVesselsRecipients.css";  // import the improved CSS

export default function AssignVesselsRecipients({ alertId, open, onClose, onAssigned }) {
  const [step, setStep] = useState(0);

  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [vessels, setVessels] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [vesselSelectionOption, setVesselSelectionOption] = useState('');
  const [selectedVessels, setSelectedVessels] = useState([]);


  const vesselOptions = [
  { value: "tracked", label: "Tracked vessels" },
  { value: "favorite", label: "Favorite vessels" },
  { value: "individual", label: "Individual vessels (select manually)" },
];


  const baseURL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (open) fetchInitialData();
    else clearAll();
  }, [open]);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/alerts/assignable-users-orgs`);
      setUsers(res.data.users.map(u => ({ id: u.loginUserId, label: u.email })));
      setOrgs(res.data.organizations.map(o => ({ id: o._id, label: o.companyName })));
    } catch (err) {
      console.error("Failed to load users/orgs", err);
    }
  };

  const clearAll = () => {
    setStep(0);
    setUsers([]);
    setOrgs([]);
    setVessels([]);
    setSelectedUsers([]);
    setSelectedOrgs([]);
    setSelectedVessels([]);
    setVesselSelectionOption('');
  };

   // Handle next button logic for step 1 (vessel option + vessels)
  const handleNextStep1 = async () => {
    if (vesselSelectionOption === 'individual') {
      await loadVessels();
    }
    setStep(2);
  };

  const loadVessels = async () => {
    try {
      const res = await axios.post(`${baseURL}/api/alerts/assignable-vessels`, {
        userIds: selectedUsers,
        orgIds: selectedOrgs,
      });
      const options = res.data.map(v => ({
        id: v.imo,
        label: `${v.name} (${v.imo})`,
      }));
      setVessels(options);
      setSelectedVessels([]);
    } catch (err) {
      console.error("Error loading vessels", err);
    }
  };

const handleAssign = async () => {

  try {
    const response = await axios.post(`${baseURL}/api/alerts/assign-alert`, {
      alertId,
      users: selectedUsers,
      organizations: selectedOrgs,
      vesselSelectionOption,
      vessels: vesselSelectionOption === "individual" ? selectedVessels : [],
    });
    console.log("Assign response", response);
    onClose();
    toast.success("Alert assigned successfully!");
    if (onAssigned) {
      onAssigned(alertId); // mark as assigned in parent
    }

  } catch (err) {
    console.error("Error assigning alert", err);

    toast.error("Failed to assign alert");
  }
};


  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-alert-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="assign-alert-title" className="modal-header">Assign Alert</h2>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="fill" style={{ width: `${(step + 1) * 33.33}%` }}></div>
        </div>

        {/* Stepper Header */}
        <div className="stepper-header">
          {["Recipients", "Vessels", "Review"].map((label, idx) => (
            <div key={label} className={`step ${step === idx ? "active" : ""}`}>
              <div className="circle">{idx + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">

        {/* Step 1: Recipients */}
{step === 0 && (
  <>
    <MultiSelectDropdown
      label="Users"
      options={users}
      selected={selectedUsers}
      setSelected={setSelectedUsers}
      placeholder="Select users..."
    />
    <div style={{ marginTop: "0.8rem" }}>
      <MultiSelectDropdown
        label="Organizations"
        options={orgs}
        selected={selectedOrgs}
        setSelected={setSelectedOrgs}
        placeholder="Select organizations..."
      />
    </div>
 
  </>
)}
 

        {/* Step 1: Vessel selection option + vessels if individual */}
          {step === 1 && (
            <>
              <div>
                <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>
                  Select Vessel Selection Option
                </label>
         <div className="radio-group">
          {vesselOptions.map(({ value, label }) => (
            <label key={value} className={`radio-tile ${vesselSelectionOption === value ? "selected" : ""}`}>
              <input
                type="radio"
                name="vesselSelectionOption"
                value={value}
                checked={vesselSelectionOption === value}
                onChange={() => setVesselSelectionOption(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>


              </div>

              {vesselSelectionOption === "individual" && (
                <MultiSelectDropdown
                  label="Vessels"
                  options={vessels}
                  selected={selectedVessels}
                  setSelected={setSelectedVessels}
                  placeholder="Select vessels..."
                />
              )}
            </>
          )}

          {/* Step 2: Review */}
      {step === 2 && (
  <div className="review-card">
    <h3 className="review-title">Review Your Alert Assignment</h3>

    <div className="review-section">
      <div className="review-item">
        <span className="review-label">📌 Alert ID:</span>
        <span className="review-value mono">{alertId}</span>
      </div>

      <div className="review-item">
        <span className="review-label">👤 Users:</span>
        <div className="tags">
          {users.filter(u => selectedUsers.includes(u.id)).map(u => (
            <span key={u.id} className="tag">{u.label}</span>
          ))}
          {selectedUsers.length === 0 && <em className="none-text">None selected</em>}
        </div>
      </div>

      <div className="review-item">
        <span className="review-label">🏢 Organizations:</span>
        <div className="tags">
          {orgs.filter(o => selectedOrgs.includes(o.id)).map(o => (
            <span key={o.id} className="tag">{o.label}</span>
          ))}
          {selectedOrgs.length === 0 && <em className="none-text">None selected</em>}
        </div>
      </div>

      <div className="review-item">
        <span className="review-label">🚢 Vessel Selection:</span>
        <span className="review-value">
          {vesselSelectionOption === "tracked" && "Tracked Vessels"}
          {vesselSelectionOption === "favorite" && "Favorite Vessels"}
          {vesselSelectionOption === "individual" && "Individual Vessels (manual selection)"}
        </span>
      </div>

      {vesselSelectionOption === "individual" && (
        <div className="review-item">
          <span className="review-label">🛳️ Selected Vessels:</span>
          <div className="tags">
            {vessels.filter(v => selectedVessels.includes(v.id)).map(v => (
              <span key={v.id} className="tag">{v.label}</span>
            ))}
            {selectedVessels.length === 0 && <em className="none-text">None selected</em>}
          </div>
        </div>
      )}
    </div>
  </div>
)}




        </div>

            {/* Button group moved outside scrollable content */}
            <div className="modal-footer">
              <div className="button-group">
                {step === 0 && (
                  <>
                    <button onClick={onClose} className="cancel">Cancel</button>
                    <button
                      disabled={selectedUsers.length === 0 && selectedOrgs.length === 0}
                      onClick={async () => {
                        await loadVessels();
                        setStep(1);
                      }}
                      className="primary"
                    >
                      Next
                    </button>
                  </>
                )}
                {step === 1 && (
                  <>
                    <button onClick={() => setStep(0)} className="cancel">Back</button>
                    <button
  disabled={!vesselSelectionOption || (vesselSelectionOption === "individual" && selectedVessels.length === 0)}
  onClick={() => setStep(2)}
  className="primary"
>
  Next
</button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <button onClick={() => setStep(1)} className="cancel">Back</button>
                    <button onClick={handleAssign} className="success">Assign Alert</button>
                  </>
                )}
              </div>
            </div>

      </div>
    </div>
  );
}

AssignVesselsRecipients.propTypes = {
  alertId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssigned: PropTypes.func,
};
