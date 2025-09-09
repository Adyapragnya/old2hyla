import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Icon from "@mui/material/Icon";
import axios from "axios";
import Card from "@mui/material/Card";
import {Box,Tooltip} from "@mui/material"
import CardContent from "@mui/material/CardContent";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Autocomplete from '@mui/material/Autocomplete';
import Popper from "@mui/material/Popper";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Loader from "./Loader";
import MyMapComponent from "./MyMapComponent";
import VesselDetailsTable from './VesselDetailsTable';
import VesselContactInfo from "./VesselContactInfo";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Swal from 'sweetalert2';
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
} from "@mui/material";


const theme = createTheme({
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: "black",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)", // Keeps label centered by default
          transition: "all 0.2s ease-in-out",
          padding: "4px", 
          marginLeft: "6px",
          display: "flex",
          alignItems: "center",
    
          "&.MuiInputLabel-shrink": {
            top: "-13px",  // Moves label above the border
            transform: "translateY(0)",
            background: "white",
            padding: "1px 1px", // Adds small padding so it doesn't touch the border
            margin: "4px 8px",
            fontSize: "12px", // Smaller label when focused
          },
    
          "&.Mui-focused": {
            color: "black",
          },
    
          [theme.breakpoints.down("sm")]: {
            fontSize: "8px", // Adjust for small screens
          },
          
          [theme.breakpoints.down("md")]: {
            fontSize: "10px", // Adjust for small screens
          },
        }),
      },
    },
  
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "black",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "black",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "black",
          },
          color: "black",
          display: "flex",
          alignItems: "center",
          height: "40px", // Adjust height
    
          [theme.breakpoints.down("md")]: {
            height: "36px",
          },
          [theme.breakpoints.down("sm")]: {
            height: "32px",
          },
        }),
        input: {
          fontSize: "12px", // Reduce selected option text size
          padding: "6px 8px", // Reduce padding
          lineHeight: 1.5,
        },
      },
    },
    
    MuiAutocomplete: {
      styleOverrides: {
        root: ({ theme }) => ({
    
          minHeight: "36px",
          [theme.breakpoints.down("md")]: {
            minHeight: "36px",
          },
          [theme.breakpoints.down("sm")]: {
            minHeight: "32px",
          },
        }),
        inputRoot: {
          color: "black",
          fontSize: "12px", // Reduce input text size
          padding: "2px 4px", // Reduce padding inside input
        },
        option: {
          padding: "2px 2px", // Default padding
          fontSize: "12px",
    
          "@media (max-width:600px)": {
            margin:"0px" ,
            padding: "2px 2px !important" , // Reduce padding for small screens
            fontSize: "10px",
          },
        },
      },
    },
  },
});
<ThemeProvider theme={theme}>
  <Autocomplete
    sx={{
      "& .MuiOutlinedInput-root": {
        display: "flex",
        alignItems: "center", // Ensures text stays centered
      },
    }}
    // {...otherProps}
/>
</ThemeProvider>;


function PortCall() {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
     

      const [refreshKey, setRefreshKey] = useState(0);
    
    const [vessels, setVessels] = useState([]);
      const [filteredVessels, setFilteredVessels] = useState([]);
    
    const [selectedVessel, setSelectedVessel] = useState(null);
    
    const [portsMarkers, setPortsMarkers] = useState([]);
    const [portNamesMarkers, setPortNamesMarkers] = useState([]);
    const [selectedPortsMarkers, setSelectedPortsMarkers] = useState(null);

    

    const [ports, setPorts] = useState(['INIXY', 'INTUT', 'INPRT', 'INMAA']);
    const [selectedPort, setSelectedPort] = useState(null);


    const hasContactInfo = (vessel) => {
  return (
    vessel?.ISM_Manager ||
    vessel?.ISM_Manager_Number ||
    vessel?.Commercial_Manager ||
    vessel?.Commercial_Manager_Telephone ||
    vessel?.Ship_Contact ||
    vessel?.Email
  );
};


  
  const [loading, setLoading] = useState(false);
  const [locode, setLocode] = useState("");
//   const [event, setEvent] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState(null);

    const handleRowClick = (vessel) => {
    setSelectedVessel(vessel);
    // console.log(vessel);
  };

    const handlePortSelect = (event, newValue) => {
    if(newValue){
    setSelectedPortsMarkers(newValue);
    } else {
    setSelectedPortsMarkers(null);

    }
  };

    useEffect(() => {
      if (selectedPortsMarkers && selectedPortsMarkers.UNLOCODE) {
        setFilteredVessels(vessels.filter(vessel => vessel.aisLocode === selectedPortsMarkers.UNLOCODE));
        // setFilteredFavoriteVessels(favoriteVessels.filter(vessel => vessel.port === selectedPort.UNLOCODE));
      } else {
        setFilteredVessels(vessels);
        // setFilteredFavoriteVessels(favoriteVessels);
      }
    }, [selectedPortsMarkers]);

const calculateMapCenter = () => {
    if (filteredVessels.length === 0) return [0, 0];
    const latSum = filteredVessels.reduce((sum, vessel) => sum + vessel.lat, 0);
    const lngSum = filteredVessels.reduce((sum, vessel) => sum + vessel.lng, 0);
    return [latSum / filteredVessels.length, lngSum / filteredVessels.length];
  };
  const center = selectedVessel ? [selectedVessel.lat, selectedVessel.lng] : calculateMapCenter();
  const zoom = selectedVessel ? 2 : 6;

  const fetchPorts = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_BASE_URL;
      const response = await axios.get(`${baseURL}/api/get-ports`);
      console.log(response.data);
      if (Array.isArray(response.data)) {
        setPortsMarkers(response.data);
        const uniquePortnames = [...new Set(response.data.map(port => port.name))];
        setPortNamesMarkers(uniquePortnames);
      } else {
        console.error("Invalid ports data received:", response.data);
        setPortsMarkers([]); // Ensure we don't pass undefined
      }
    } catch (error) {
      console.error("Error fetching ports:", error);
      setPortsMarkers([]); // Handle error by setting an empty array
    }
  };

 
  
 

const fetchSavedArrivals = async () => {
  setLoading(true);
  setError(null); // Reset previous error
  try {
    const { data } = await axios.get(`${baseURL}/api/expected-arrivals/all`);

    if (Array.isArray(data)) {
      setVessels(data);
      setFilteredVessels(data);
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (err) {
    console.error("Error fetching saved arrivals:", err);
    setError(err?.response?.data?.error || "Failed to load saved port calls.");
  } finally {
    setLoading(false);
  }
};

// Fetch on mount
useEffect(() => {
  fetchSavedArrivals();
  fetchPorts();
}, []);



   const formatDateTime = (isoStr) => {
  const [date, time] = isoStr.split("T");
  return `${date} ${time}:00`; // Add seconds
};


const handleSubmit = async () => {
  if (!locode || !fromDate || !toDate) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Fields',
      text: 'All fields are required.',
    });
    return;
  }

    const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = to.getTime() - from.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays > 4) {
    Swal.fire({
      icon: 'error',
      title: 'Date Range Restriction',
      text: 'Date range cannot be more than 4 days.',
    });
    return;
  }

  const formattedFrom = formatDateTime(fromDate);
  const formattedTo = formatDateTime(toDate);

  setLoading(true);
  // setError(null);


  // console.log(locode,formattedFrom,formattedTo);
  try {

    const response = await axios.post(`${baseURL}/api/expected-arrivals/fetch-and-save`, {
      locode,
      fromDate: formattedFrom,
      toDate: formattedTo,
    });

    console.log(response);
    // console.log(locode,formattedFrom,formattedTo);
    // console.log("Saved arrivals:", response.data);
    // You can display results here

         // Refresh the list after saving
      fetchSavedArrivals();
  } catch (err) {
    console.error("Error:", err);
    setError("Failed to fetch and save expected arrivals.");
  } finally {
    setLoading(false);
  }
};


  return (
 <DashboardLayout>
  <DashboardNavbar />
  {loading ? (
    <Loader />
  ) : (
    <ArgonBox py={2} px={3}>
      <ArgonTypography variant="h5" mb={3}>
        Port Call Search
      </ArgonTypography>

      {/* === Search Form Card === */}
      
<Card
  sx={{
    mb: 3,
    p: 2,
    borderRadius: 2,
    boxShadow: 2,
    backgroundColor: "#fdfdfd",
  }}
>
  <Grid container spacing={2}>
    {/* Port Dropdown */}
    <Grid item xs={12} md={3}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label htmlFor="locode" style={{ fontSize: "13px", fontWeight: 500 }}>
          Select Port
        </label>
        <select
          id="locode"
          value={locode}
          onChange={(e) => setLocode(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          <option value="">-- Select --</option>
    {portsMarkers.map((port) => (
      <option key={port.UNLOCODE} value={port.UNLOCODE}>
        {port.name}
      </option>
    ))}
</select>
      </div>
    </Grid>

    {/* From Date */}
    <Grid item xs={12} md={3}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label htmlFor="fromDate" style={{ fontSize: "13px", fontWeight: 500 }}>
          From Date & Time
        </label>
        <input
          type="datetime-local"
          id="fromDate"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
    </Grid>

    {/* To Date */}
    <Grid item xs={12} md={3}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label htmlFor="toDate" style={{ fontSize: "13px", fontWeight: 500 }}>
          To Date & Time
        </label>
        <input
          type="datetime-local"
          id="toDate"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          min={fromDate}  // This prevents choosing a date earlier than 'fromDate'
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
    </Grid>

    {/* Search Button */}
    <Grid item xs={12} md={3} display="flex" alignItems="flex-end">
      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
          padding: "8px 10px",
          backgroundColor: "#1976d2",
          color: "#fff",
          fontWeight: 600,
          fontSize: "14px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🔍 Fetch & Add
      </button>
    </Grid>
  </Grid>
</Card>







  <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mb={1}>
      <ThemeProvider theme={theme}>
  <Autocomplete
    PaperProps={{
      sx: {
        borderRadius: "10px",
        overflow: "hidden",
        zIndex: 10000, // Ensure higher priority
        width: "250px", // Increase dropdown width
        minWidth: "250px",
      },
    }}
    PopperComponent={(props) => (
      <Popper {...props} style={{ zIndex: 10000, width: "180px" }} /> // Boost priority
    )}
    options={portsMarkers || []}
    getOptionLabel={(option) => (typeof option === "object" && option?.name ? option.name : "")}
    onChange={handlePortSelect}
    renderInput={(params) => (
      <TextField {...params} label="Filter by Port" variant="outlined" size="small" />
    )}
    sx={{
      minWidth: 180, // Default width
      maxWidth: 200,
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        height: "34px", // Reduce height
        fontSize: "12px", // Reduce selected option size
        padding: "4px 6px", // Reduce input padding
      },
      "@media (max-width: 600px)": {
        minWidth: 180, // Smaller width on mobile
        "& .MuiOutlinedInput-root": {
          height: "34px", // Adjust height for small screens
        },
        "& .MuiInputLabel-root": {
          fontSize: "10px", // Reduce label size
        },
      },
    }}
  />
</ThemeProvider>
</Box>

      {/* === Map Display === */}
      {/* {filteredVessels.length > 0 && ( */}
  <Grid container spacing={2}>
  {
    hasContactInfo(selectedVessel) ? (
      <>
        {/* Map with Contact Info Layout */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "17px",
              boxShadow: 1,
              padding: 2,
              height: "550px",
            }}
          >
            <CardContent sx={{ height: "100%", padding: 1 }}>
              <MyMapComponent
                zoom={zoom}
                center={center}
                vessels={filteredVessels}
                selectedVessel={selectedVessel}
                ports={portsMarkers}
                selectedPort={selectedPortsMarkers}
                 onVesselClick={setSelectedVessel}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          
          <VesselContactInfo vessel={selectedVessel} />
        </Grid>
      </>
    ) : (
      <>
        {/* Full-Width Map Only */}
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "17px",
              boxShadow: 1,
              padding: 2,
              height: "550px",
            }}
          >
            <CardContent sx={{ height: "100%", padding: 1 }}>
              <MyMapComponent
                zoom={zoom}
                center={center}
                vessels={filteredVessels}
                selectedVessel={selectedVessel}
                ports={ports}
                selectedPort={selectedPortsMarkers}
                 onVesselClick={setSelectedVessel}
              />
            </CardContent>
          </Card>
        </Grid>
       
      </>
    )
  }
</Grid>



      {/* )} */}

 <Grid item xs={12} md={6} mt={2}>
            <Card
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: "17px",
                boxShadow: 1,
                padding: 2,
                height: "550px",
              }}
            >
              <CardContent
                sx={{
                  backgroundColor: "#ffffff",
                  padding: 0,
                  height: "100%",
                }}
              >
                <VesselDetailsTable
                  key={refreshKey}
                  vessels={filteredVessels}
                  onRowClick={handleRowClick}
                //   highlightRow={highlightRow}
                  setVessels={setVessels}
                  setFilteredVessels={setFilteredVessels}
                  // setSelectedVessel={setSelectedVessel}
                />
              </CardContent>
            </Card>
          </Grid>

    </ArgonBox>
  )}
  <Footer />
</DashboardLayout>

  );
}

export default PortCall;
