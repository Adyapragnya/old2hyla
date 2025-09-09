import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
  Divider,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";

const InfoRow = ({ icon, label, value }) => (
  <Box display="flex" alignItems="center" mb={1.5}>
    <Box sx={{ color: "text.secondary", mr: 1.5, minWidth: 24 }}>{icon}</Box>
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.2 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const VesselContactInfo = ({ vessel }) => {
  if (!vessel) return null;

  const {
    ISM_Manager,
    ISM_Manager_Number,
    Commercial_Manager,
    Commercial_Manager_Telephone,
    Ship_Contact,
    Email,
  } = vessel;

  const hasInfo =
    ISM_Manager ||
    ISM_Manager_Number ||
    Commercial_Manager ||
    Commercial_Manager_Telephone ||
    Ship_Contact ||
    Email;

  return (
    <Card
      elevation={1}
      sx={{
        height: "100%",            // fill parent height
        borderRadius: 2,
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          px: 3,
          py: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "primary.main", mb: 2 }}
        >
          Vessel Contact Info
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {hasInfo ? (
          <>
            {ISM_Manager && (
              <InfoRow
                icon={<BusinessIcon fontSize="small" />}
                label="ISM Manager"
                value={ISM_Manager}
              />
            )}
            {ISM_Manager_Number && (
              <InfoRow
                icon={<PhoneIcon fontSize="small" />}
                label="ISM Phone"
                value={ISM_Manager_Number}
              />
            )}
            {Commercial_Manager && (
              <InfoRow
                icon={<BusinessIcon fontSize="small" />}
                label="Commercial Manager"
                value={Commercial_Manager}
              />
            )}
            {Commercial_Manager_Telephone && (
              <InfoRow
                icon={<PhoneIcon fontSize="small" />}
                label="Commercial Phone"
                value={Commercial_Manager_Telephone}
              />
            )}
            {Ship_Contact && (
              <InfoRow
                icon={<ContactPhoneIcon fontSize="small" />}
                label="Inmarsat Data"
                value={Ship_Contact}
              />
            )}
            {Email && (
              <InfoRow
                icon={<EmailIcon fontSize="small" />}
                label="Email"
                value={
                  <Tooltip title={Email}>
                    <span style={{ cursor: "default", userSelect: "text" }}>
                      {Email}
                    </span>
                  </Tooltip>
                }
              />
            )}
          </>
        ) : (
          <Typography
            variant="body2"
            sx={{
              fontStyle: "italic",
              color: "text.secondary",
              fontSize: 14,
              mt: 1,
              textAlign: "center",
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            No ISM contact information available.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

InfoRow.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
};

VesselContactInfo.propTypes = {
  vessel: PropTypes.shape({
    ISM_Manager: PropTypes.string,
    ISM_Manager_Number: PropTypes.string,
    Commercial_Manager: PropTypes.string,
    Commercial_Manager_Telephone: PropTypes.string,
    Ship_Contact: PropTypes.string,
    Email: PropTypes.string,
  }),
};

export default VesselContactInfo;
