import { useState, useEffect, useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Badge from "@mui/material/Badge"; // Import Badge component
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import Typography from "@mui/material/Typography";
import {Select, FormControl, InputLabel, Autocomplete, Checkbox, List, ListItem, ListItemText, Chip } from '@mui/material';
import Box from "@mui/material/Box";
import ArgonInput from "components/ArgonInput";
import Breadcrumbs from "examples/Breadcrumbs";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationItem from "examples/Items/NotificationItem";
import ApartmentIcon from '@mui/icons-material/Apartment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Grid, Stack } from "@mui/material";
import './style.css';
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";
import {
  useArgonController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";
import Swal from 'sweetalert2';
import team2 from "assets/images/team-2.jpg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import axios from 'axios';
import { AuthContext } from "../../../AuthContext";

function DashboardNavbar({ absolute, light, isMini, showButton, dropdownOptions, vesselEntries  }) {
  const baseURL = process.env.REACT_APP_API_BASE_URL;


  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const { role, id, loginEmail } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);

  
  // --- STATE FOR ORG DIALOG ---
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [openOrgDialog, setOpenOrgDialog]   = useState(false);
  const [orgDocs,          setOrgDocs]      = useState([]);
  const [orgSatValues,     setOrgSatValues] = useState({});

  // --- STATE FOR ROLE DIALOG ---
  const [openRoleDialog,  setOpenRoleDialog]  = useState(false);
  const [roleSatValues,   setRoleSatValues]   = useState({});
  
  const handleIconClick = (event) => {
    setAnchorEl(event.currentTarget); // Set the popover anchor
  };

  const handleClose = () => {
    setAnchorEl(null); // Close the popover
  };

  const isOpen = Boolean(anchorEl); // Determine if popover is open
  const popoverId = isOpen ? "user-account-popover" : undefined;
  const [selectedOrgId, setSelectedOrgId] = useState('');
  // Handle change in the selected organization from dropdown
  const handleOrgSelect = (event, newValue) => {
    setSelectedOrgId(newValue ? newValue.orgId : ''); // If null, set to empty string
  };


const toTitleCase = (str) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());


  const fetchOrgIntervals = async () => {
    try {
      setOrgSearchTerm("");      // clear previous search
      const res  = await fetch(`${baseURL}/api/sat-intervals/get-sat-intervals-basedon-role?roleType=organization`);
      const data = await res.json();            // array of org docs
      setOrgDocs(data);

      // map into orgSatValues
      const vals = {};
      data.forEach(doc => {
        vals[doc.orgId] = {
          companyName: doc.companyName,
          sat0:  doc.sat0  / 60000,
          sat1a: doc.sat1a / 60000,
          sat1b: doc.sat1b / 60000,
        };
      });
      setOrgSatValues(vals);
      setOpenOrgDialog(true);
    } catch (err) {
      console.error("Error fetching org intervals", err);
    }
  };

  // 2) Role (“hyla admin” & “guest”) intervals
  const fetchRoleIntervals = async () => {
    try {
      const roles = ["hyla admin", "guest"];
      const vals  = {};
      for (const rt of roles) {
        const res   = await fetch(`${baseURL}/api/sat-intervals/get-sat-intervals-basedon-role?roleType=${encodeURIComponent(rt)}`);
        const [doc] = await res.json();
        if (doc) {
          vals[rt] = {
            sat0:  doc.sat0  / 60000,
            sat1a: doc.sat1a / 60000,
            sat1b: doc.sat1b / 60000,
          };
        }
      }
      setRoleSatValues(vals);
      setOpenRoleDialog(true);
    } catch (err) {
      console.error("Error fetching role intervals", err);
    }
  };


    // --- HANDLERS ---

  const handleOrgSatChange = (orgId, key, value) => {
    setOrgSatValues(prev => ({
      ...prev,
      [orgId]: { ...prev[orgId], [key]: Number(value) }
    }));
  };

  const handleRoleSatChange = (roleType, key, value) => {
    setRoleSatValues(prev => ({
      ...prev,
      [roleType]: { ...prev[roleType], [key]: Number(value) }
    }));
  };



  const route = useLocation().pathname.split("/").slice(1);

  useEffect(() => {
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);


  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(null);

  const handleDropdownClick = (event) => {
    setDropdownAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownAnchorEl(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };



// POST helper that takes any array of payload entries
const updateSatIntervals = async (payload) => {
  const res = await fetch(`${baseURL}/api/sat-intervals/update-sat-intervals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updatedSatValues: payload })
  });
  return res.ok;
};

// Shared helper to validate one entry is > 0
const isValidEntry = (vals) =>
  ["sat0","sat1a","sat1b"].every(
    (k) =>
      typeof vals[k] === "number" &&
      !isNaN(vals[k]) &&
      vals[k] > 0
  );

// Org‑only submit
const handleOrgSubmit = async () => {

    // 1) Validate all org entries
  for (const [orgId, v] of Object.entries(orgSatValues)) {
    if (!isValidEntry(v)) {
    return Swal.fire({
  icon: "error",
  title: "Invalid Input",
  text: `Organization ${orgId}: all fields must be numbers greater than zero.`,
  willOpen: () => {
    const popup = document.querySelector('.swal2-popup');
    if (popup) {
      popup.style.zIndex = '2001'; // must be > MUI Dialog's 1300+
    }
  }
});
    }
  } 

  const orgPayload = Object.entries(orgSatValues).map(([orgId, v]) => ({
    orgId,
    sat0:  v.sat0  * 60000,
    sat1a: v.sat1a * 60000,
    sat1b: v.sat1b * 60000,
  }));
  if (await updateSatIntervals(orgPayload)) {
    Swal.fire({ icon: "success", title: "SAT Intervals Updated!" });
    setOpenOrgDialog(false);
  } else {
    Swal.fire({ icon: "error", title: "Failed to save organizations" });
  }
};

// Role‑only submit
const handleRoleSubmit = async () => {
    // 1) Validate all role entries
  for (const [rt, v] of Object.entries(roleSatValues)) {
    if (!isValidEntry(v)) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: `Role "${rt}": all fields must be numbers greater than zero.`,
      });
    }
  }

  const rolePayload = Object.entries(roleSatValues).map(([rt, v]) => ({
    roleType: rt,
    sat0:  v.sat0  * 60000,
    sat1a: v.sat1a * 60000,
    sat1b: v.sat1b * 60000,
  }));
  if (await updateSatIntervals(rolePayload)) {
    Swal.fire({ icon: "success", title: "SAT Intervals Updated!" });
    setOpenRoleDialog(false);
  } else {
    Swal.fire({ icon: "error", title: "Failed to save roles" });
  }
};


  const renderMenu = () => {
    const vesselEntriesArray = Array.isArray(vesselEntries)
      ? vesselEntries
      : Object.keys(vesselEntries).map((key) => ({ name: key, ...vesselEntries[key] }));
  
    return (
      <Menu
        anchorEl={openMenu}
        anchorReference={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={Boolean(openMenu)}
        onClose={handleCloseMenu}
        sx={{ mt: 2 }}
      >
        {vesselEntriesArray.length ? (
          vesselEntriesArray.map((vessel, index) => (
            <NotificationItem
              key={index}
              image={<DirectionsBoatIcon />}  // Use ship icon here
              title={vessel.name || "Unnamed Vessel"}
              date={vessel.entryTime || "No entry time available"}
              geofenceName={vessel.geofence || "No geofence name"}  // Add geofenceName
              onClick={handleCloseMenu}
            />
          ))
        ) : (
          <MenuItem disabled>No vessels available</MenuItem>
        )}
      </Menu>     
    );
  };

  const renderDropdown = () => (
    <Menu
      anchorEl={dropdownAnchorEl}
      anchorReference="anchorEl"
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      open={Boolean(dropdownAnchorEl)}
      onClose={handleDropdownClose}
      sx={{ mt: 2, padding: 2, minWidth: 200 }}  // Add padding and minWidth for better layout
    >
      <MenuItem>
        <ArgonInput 
          placeholder="Search..." 
          fullWidth 
          onChange={handleSearchChange}
          value={searchTerm}
        />
      </MenuItem>

      {/* Dropdown options from props */}
      {filteredOptions.length ? (
        filteredOptions.map((option, index) => (
          <MenuItem key={index} onClick={() => {
            // Handle option selection if needed
            handleDropdownClose();
          }}>
            {option}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No options available</MenuItem>
      )}
    </Menu>
  );

  
  return (
    <><AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
      style={{ marginTop: '-30px' }}
    >
    
        <Toolbar sx={(theme) => navbarContainer(theme, { navbarType })}>
          <ArgonBox
            color={light && transparentNavbar ? "white" : "dark"}
            mb={{ xs: 1, md: 0 }}
            sx={(theme) => navbarRow(theme, { isMini })}
          >
            <Breadcrumbs
              icon="home"
              title={route[route.length - 1]}
              route={route}
              light={transparentNavbar ? light : false} />
            <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
              {miniSidenav ? "menu_open" : "menu"}
            </Icon>
          </ArgonBox>

          {isMini ? null : (
            <>
              <ArgonBox sx={(theme) => navbarRow(theme, { isMini })}>
                <ArgonBox color={light ? "white" : "inherit"} display="flex" alignItems="center">

                  <IconButton
                    size="small"
                    color={light && transparentNavbar ? "white" : "dark"}
                    sx={navbarMobileMenu}
                    onClick={handleMiniSidenav}
                  >
                    <Icon>{miniSidenav ? "menu_open" : "menu"}</Icon>
                  </IconButton>

           
            {/* Tooltip and IconButton */}
            
        <IconButton
          size="small"
          color="inherit"
          onClick={handleIconClick}
          sx={{
            padding: "2px", // Fixed padding to prevent resizing
            transition: "none", // Disable animations during interaction
            "&:hover": {
              backgroundColor: "transparent", // Optional: keep background unchanged
            },
            "&:active": {
              transform: "none", // Prevent movement on click
            },
          }}
        >
          <AccountCircleIcon />
        </IconButton>

      {/* Styled Popover */}
      <Popover
        id={popoverId}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        sx={{
          "& .MuiPopover-paper": {
            background: "linear-gradient(to bottom right, #ffffff, #f9f9f9)", // soft gradient
            color: "#333",
            borderRadius: "12px",
            boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)",
            minWidth: "200px",
            padding: "12px 16px",
            "@media (max-width: 767px)": {
              minWidth: "160px",
              marginLeft: "8px",
              padding: "10px",
            },
          },
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: "#1976d2", width: 40, height: 40 }}>
            {loginEmail ? loginEmail[0].toUpperCase() : "?"}
          </Avatar>
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#444",
              textAlign: "center",
            }}
          >
            {loginEmail || "No Email Provided"}
          </Typography>
          <Divider sx={{ width: "100%", my: 1 }} />
        </Box>
      </Popover>


{role === "hyla admin" && (
  <Stack direction="row" spacing={0} alignItems="center">
    {/* Organization settings */}
    <Tooltip title="Organization Vessel Update Intervals" arrow>
      <IconButton
        size="small"
        sx={navbarIconButton}
        onClick={fetchOrgIntervals}
        color="white"
        
      >
        <ApartmentIcon fontSize="small" sx={{ color: "white" }} />
      </IconButton>
    </Tooltip>

    {/* Role settings */}
    <Tooltip title="Role Vessel Update Intervals" arrow>
      <IconButton
        size="small"
        sx={navbarIconButton}
        onClick={fetchRoleIntervals}
        color="white"
        
      >
        <AdminPanelSettingsIcon fontSize="small" sx={{ color: "#fff" }} />
      </IconButton>
    </Tooltip>
  </Stack>
)}


      <IconButton
      size="small"
      color={light && transparentNavbar ? "white" : "dark"}
      sx={navbarIconButton}
      aria-controls="notification-menu"
      aria-haspopup="true"
      variant="contained"
      onClick={handleOpenMenu}
    >
      <Badge
        badgeContent={Object.keys(vesselEntries).length}
        // color="secondary"
        sx={{
          "& .MuiBadge-dot": {
            backgroundColor: light ? "white" : "black",
          },
          "& .MuiBadge-badge": {
            right: 0, // Adjust badge position horizontally
            top: -3, // Adjust badge position vertically
            padding: '0 4px', // Smaller padding
            fontSize: '0.75rem', // Smaller font size
            minWidth: '16px', // Smaller minimum width
            height: '16px', // Smaller height
            borderRadius: '50%', // Fully rounded badge
            display: 'flex', // Center text horizontally and vertically
            alignItems: 'center', // Center text vertically
            justifyContent: 'center', // Center text horizontally
            backgroundColor: 'red'
          },
        }}
      >
        <Icon>notifications</Icon>
      </Badge>
      </IconButton>
    </ArgonBox>
  </ArgonBox></>

      )}
    </Toolbar>
    {renderDropdown()}
    {renderMenu()}

{/* —————————————————————————————————————————————— */}
{/* Organization SAT Dialog */}
{/* —————————————————————————————————————————————— */}
<Dialog
  open={openOrgDialog}
  onClose={() => setOpenOrgDialog(false)}
  fullWidth
  maxWidth="md"
  PaperProps={{
    style: {
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
  }}
>
  <DialogTitle
    style={{ fontSize: "1.2rem", fontWeight: "bold", textAlign: "center" }}
  >
      UPDATE ORGANIZATION SAT INTERVALS (In Minutes)
    </DialogTitle>

   <DialogContent
    style={{
      // display: "flex",
      // flexDirection: "column",
      // alignItems: "center",
      // gap: "20px",
      padding: "20px",
    }}
  >
        <FormControl fullWidth style={{ marginBottom: "7px" }}>
        {/* Autocomplete search */}
        <Autocomplete
          freeSolo
          size="small"
          fullWidth
          options={orgDocs.map((doc) => doc.companyName)}
          inputValue={orgSearchTerm}
          onInputChange={(_, newValue) => setOrgSearchTerm(newValue)}
          filterOptions={(opts, { inputValue }) =>
            opts.filter((name) =>
              name.toLowerCase().includes(inputValue.trim().toLowerCase())
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Search by company name…"
              InputProps={{
                ...params.InputProps,
                style: {
                  backgroundColor: "white",
                  border: "1px solid rgba(0, 0, 0, 0.23)",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                },
              }}
              style={{ width: "100%" }}
            />
          )}
        />
      </FormControl>

        {/* Stack ensures uniform spacing between cards */}
  <Stack spacing={1} width="100%">
        {/* List of filtered organizations */}
        {orgDocs
          .filter((doc) =>
            doc.companyName
              .toLowerCase()
              .includes(orgSearchTerm.trim().toLowerCase())
          )
          .map((doc) => {
            const vals = orgSatValues[doc.orgId] || {};
            return (
            <Box
            key={doc.orgId}
            sx={{
              background: "#f9f9f9",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {doc.companyName}
            </Typography>

                {/* Responsive grid: stacks to one column on xs, three columns on md+ */}
                  <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mt: 1,
              }}
            >
                  {["sat0", "sat1a", "sat1b"].map((k) => (
                    <div
                  key={k}
                  style={{
                    flex: "1 1 30%",
                    minWidth: "120px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#555",
                      marginBottom: "4px",
                    }}
                  >
                    {k.toUpperCase()}
                  </label>
                  <TextField
                    type="number"
                    variant="outlined"
                    fullWidth
                    value={vals[k] === 0 ? "" : vals[k] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleOrgSatChange(doc.orgId, k, val === "" ? undefined : Number(val));
                    }}
                    inputProps={{ min: 0 }}
                  />
                </div>
                  ))}
                 </Box>
          </Box>
            );
          })}
  </Stack>
      
    </DialogContent>

     <DialogActions style={{ justifyContent: "flex-end", padding: "10px" }}>
      <Button
        onClick={() => setOpenOrgDialog(false)}
        variant="outlined"
        sx={{ fontSize: 12, px: 2, mr: 1 }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleOrgSubmit}
        variant="contained"
        sx={{ fontSize: 12, px: 2 }}
      >
        Update
      </Button>
    </DialogActions>
  </Dialog>

{/* —————————————————————————————————————————————— */}
{/* Role (“hyla admin” & “guest”) SAT Dialog */}
{/* —————————————————————————————————————————————— */}

<Dialog
  open={openRoleDialog}
  onClose={() => setOpenRoleDialog(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    style: {
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
  }}
>

  <DialogTitle
    style={{ fontSize: "1.2rem", fontWeight: "bold", textAlign: "center" }}>
    Update SAT Intervals (In Minutes)</DialogTitle>
    <DialogContent
    style={{
      padding: "20px",
    }}
  >
    <Stack spacing={2}>
    {["hyla admin", "guest"].map((rt) => {
      const vals = roleSatValues[rt] || {};
      return (
             <Box
            key={rt}
            sx={{
              backgroundColor: "#f9f9f9",
              borderRadius: 2,
              p: 2,
            }}
          >
          <Typography variant="subtitle1">{toTitleCase(rt)}</Typography>
              <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mt: 1,
              }}
            >
            {["sat0", "sat1a", "sat1b"].map((k) => (
                <Box key={k} sx={{ flex: "1 1 30%", minWidth: 120 }}>
                  <Typography
                    component="label"
                    sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}
                  >
                    {k.toUpperCase()}
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={vals[k] === 0 ? "" : vals[k] ?? ""}
                    onChange={(e) => handleRoleSatChange(rt, k, e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Box>
            ))}
          </Box>
        </Box>
      );
    })}
    </Stack>
  </DialogContent>

  <DialogActions style={{ justifyContent: "flex-end", padding: "10px" }}>
    <Button
      onClick={() => setOpenRoleDialog(false)}
      variant="outlined"
      sx={{ fontSize: 12, px: 2, mr: 1 }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleRoleSubmit}
      variant="contained"
      sx={{ fontSize: 12, px: 2 }}
    >
      Save Roles
    </Button>
  </DialogActions>

</Dialog>

  </AppBar></>
  );
}

DashboardNavbar.defaultProps = {
  absolute: false,
  light: true,
  isMini: false,
  showButton: false,
  dropdownOptions: [],
  vesselEntries: [],
};

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
  showButton: PropTypes.bool,
  dropdownOptions: PropTypes.arrayOf(PropTypes.string),
  vesselEntries: PropTypes.arrayOf(PropTypes.object), 
 
};

export default DashboardNavbar;