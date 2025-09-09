import React, { useState, useEffect  } from 'react';
import {
  Card, TextField, Button, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Box, IconButton, Tooltip
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import { MenuItem } from '@mui/material';


// Flatten nested keys from sample object
const flattenKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

export default function VesselApiForm() {
  const [apiName, setApiName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState('');

  const [mapping, setMapping] = useState({});
  const [unmatchedApiFields, setUnmatchedApiFields] = useState([]);

  const [exactMatches, setExactMatches] = useState([]); // new state for exact matches
  const [newFields, setNewFields] = useState({});
  const [sample, setSample] = useState(null);
  const [imo, setImo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  // Check for duplicate API response fields in mapping
  const usedApiFields = new Set(Object.values(mapping).filter(Boolean));
  const hasDuplicateMappings = Object.values(mapping).some((v, i, arr) => v && arr.indexOf(v) !== i);

  // Split mappings into exact and fuzzy matches using exactMatches from backend
  const exactMatchesSet = new Set(exactMatches);

  const exactMappedFields = Object.entries(mapping)
    .filter(([aisField, apiField]) => exactMatchesSet.has(aisField) && apiField)
    .map(([aisField, apiField]) => ({ aisField, apiField }));

  const fuzzyMappedFields = Object.entries(mapping)
    .filter(([aisField, apiField]) => !exactMatchesSet.has(aisField) && apiField)
    .map(([aisField, apiField]) => ({ aisField, apiField }));

  // Unmatched API fields = newFields keys not used in any mapping
  // const unmatchedApiFields = Object.keys(newFields)
  //   .filter(apiField => !usedApiFields.has(apiField));



  const handleSuggest = async () => {
    if (!apiName || !apiUrl || !apiKey || !apiType) {  // Add apiType validation
    alert('Please fill all API details');
    return;
  }

    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/vessel-api/suggest-mapping`, {
        apiName, apiUrl, apiKey, apiType 
      });
      const { mapping, newFields, sample, imo, unmatchedApiFields  } = res.data;
      console.log(res.data);
      setMapping(mapping);
      setNewFields(newFields);
      setSample(sample);
      setImo(imo);
      setUnmatchedApiFields(unmatchedApiFields || []);
    } catch (error) {
      console.error(error);
      alert('Failed to suggest mapping. Check API details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post(`${baseURL}/api/vessel-api/save-mapping`, {
        apiName, apiUrl, apiKey, mapping, newFields, imo
      });
      alert('Mapping saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save mapping.');
    } finally {
      setLoading(false);
    }
  };

 const handleMappingChange = (aisField, newApiField) => {
  // Prevent duplicate API fields usage
  if (newApiField && Object.values(mapping).includes(newApiField) && mapping[aisField] !== newApiField) {
    alert('This API field is already mapped to another AIS field.');
    return;
  }

  setMapping(prev => {
    const updatedMapping = { ...prev, [aisField]: newApiField };

    // Update unmatchedApiFields accordingly
    setUnmatchedApiFields(prevUnmatched => {
      // Find API fields currently unmatched
      const currentlyUnmatched = new Set(prevUnmatched);

      // Get the old mapped API field for this AIS field
      const oldApiField = prev[aisField];

      // If the newApiField was previously unmatched, remove it
      if (newApiField && currentlyUnmatched.has(newApiField)) {
        currentlyUnmatched.delete(newApiField);
      }

      // If oldApiField is being unmapped, add it back to unmatched if not null/empty
      if (oldApiField && oldApiField !== newApiField) {
        currentlyUnmatched.add(oldApiField);
      }

      return Array.from(currentlyUnmatched);
    });

    return updatedMapping;
  });
};


const handleNewFieldChange = (apiField, dataType = 'String', targetName = '') => {
  setNewFields(prev => ({
    ...prev,
    [apiField]: { dataType, targetName }
  }));

  setUnmatchedApiFields(prevUnmatched => {
    const newSet = new Set(prevUnmatched);
    newSet.delete(apiField);
    return Array.from(newSet);
  });
};



 const removeNewField = (apiField) => {
  setNewFields(prev => {
    const copy = { ...prev };
    delete copy[apiField];
    return copy;
  });

  setUnmatchedApiFields(prevUnmatched => {
    if (!prevUnmatched.includes(apiField)) {
      return [...prevUnmatched, apiField];
    }
    return prevUnmatched;
  });
};


 return (
    <Card elevation={3} sx={{ borderRadius: 3, background: "#f5f5f5", border: "1px solid #e0e0e0", p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Vessel API Mapping</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField label="API Name" value={apiName} onChange={e => setApiName(e.target.value)} fullWidth />
        <TextField label="API URL" value={apiUrl} onChange={e => setApiUrl(e.target.value)} fullWidth />
        <TextField label="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} fullWidth />
        <TextField label="API Type" value={apiType} onChange={e => setApiType(e.target.value)} fullWidth select>
          <MenuItem value="vtexplorer">VTExplorer</MenuItem>
          <MenuItem value="lloyds">Lloyds</MenuItem>
        </TextField>
      </Box>
      <Button variant="contained" onClick={handleSuggest} disabled={loading}>
        {loading ? 'Loading...' : 'Suggest Mapping'}
      </Button>

      {error && <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>}

      {sample && (
        <>
          <Typography variant="h6" mt={4} mb={2}>Sample AIS Data (for IMO: {imo})</Typography>
          <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 2, mb: 4 }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(sample, null, 2)}
            </pre>
          </Paper>

          {/* Matches */}
          <Typography variant="h6" mt={4}>Matched AIS Fields</Typography>
          <Table size="small" sx={{ mb: 4 }}>
            <TableHead>
              <TableRow>
                <TableCell>AIS Field</TableCell>
                <TableCell>API Response Field</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(mapping).filter(([, apiField]) => apiField).map(([aisField, apiField]) => (
                <TableRow key={aisField}>
                  <TableCell>{aisField}</TableCell>
                  <TableCell>
                    <Autocomplete
                      freeSolo
                      options={flattenKeys(sample).filter((option) => option === apiField || !usedApiFields.has(option))}
                      value={apiField}
                      onChange={(e, newValue) => {
                        if (!newValue) return; // Prevent clearing mappings
                        if (newValue && Object.values(mapping).includes(newValue) && mapping[aisField] !== newValue) {
                          alert('This API field is already mapped to another AIS field.');
                          return;
                        }
                        handleMappingChange(aisField, newValue || '');
                      }}
                      renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleMappingChange(aisField, '')} title="Remove Mapping">
                      <Cancel />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Unmatched API Fields */}
          <Typography variant="h6" mt={4}>Unmatched API Fields (Map or Add as New Field)</Typography>
          <Table size="small" sx={{ mb: 4 }}>
            <TableHead>
              <TableRow>
                <TableCell>API Field</TableCell>
                <TableCell>Map to AIS Field</TableCell>
                <TableCell>Or Add as New</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unmatchedApiFields.map(apiField => {
                const isMapped = Object.values(mapping).includes(apiField);
                const isNewField = apiField in newFields;
                return (
                  <TableRow key={apiField}>
                    <TableCell>{apiField}</TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        options={Object.keys(mapping).filter((aisField) => {
                          const currentMappedApiField = mapping[aisField];
                          return !usedApiFields.has(currentMappedApiField) || currentMappedApiField === apiField;
                        })}
                        value={Object.entries(mapping).find(([, v]) => v === apiField)?.[0] || ''}
                        onChange={(e, newValue) => {
                          if (!newValue) return; // Prevent clearing mappings
                          if (mapping[newValue] && mapping[newValue] !== apiField) {
                            alert('That AIS field is already mapped to another API field.');
                            return;
                          }

                          if (isNewField) {
                            removeNewField(apiField);
                          }

                          // Clear any previous mapping of this API field
                          setMapping(prev => {
                            const cleared = Object.fromEntries(Object.entries(prev).map(([k, v]) =>
                              v === apiField ? [k, ''] : [k, v]
                            ));
                            return { ...cleared, [newValue]: apiField };
                          });

                          // Update unmatched fields
                          handleMappingChange(newValue, apiField);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            fullWidth
                            placeholder="AIS Field"
                            disabled={isNewField}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleNewFieldChange(apiField, 'String', apiField.split('.').pop())}
                        disabled={isMapped}
                      >
                        Add to New
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Newly Added Fields */}
          <Typography variant="h6" mt={4}>Newly Added Fields</Typography>
          <Table size="small" sx={{ mb: 4 }}>
            <TableHead>
              <TableRow>
                <TableCell>API Field</TableCell>
                <TableCell>Target Field Name</TableCell>
                <TableCell>Data Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(newFields).map(([apiField, { targetName, dataType }]) => (
                <TableRow key={apiField}>
                  <TableCell>{apiField}</TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={targetName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setNewFields(prev => ({
                          ...prev,
                          [apiField]: { ...prev[apiField], targetName: newName }
                        }));
                      }}
                      fullWidth
                      placeholder="Enter target field name"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      SelectProps={{ native: true }}
                      variant="standard"
                      value={dataType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setNewFields(prev => ({
                          ...prev,
                          [apiField]: { ...prev[apiField], dataType: newType }
                        }));
                      }}
                      fullWidth
                    >
                      <option value="String">String</option>
                      <option value="Number">Number</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Date">Date</option>
                      <option value="Object">Object</option>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeNewField(apiField)}>
                      <Cancel />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Duplicate Mapping Error */}
          {hasDuplicateMappings && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              Duplicate API field mappings are not allowed.
            </Typography>
          )}

          {/* Save Button */}
          <Button variant="contained" color="success" onClick={handleSave} disabled={loading || hasDuplicateMappings}>
            {loading ? 'Saving...' : 'Save Mappings'}
          </Button>
        </>
      )}
    </Card>
  );
}
