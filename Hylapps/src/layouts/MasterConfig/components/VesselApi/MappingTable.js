import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, IconButton } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Cancel } from '@mui/icons-material';
import PropTypes from 'prop-types';

const MappingTable = ({ mapping, sample, usedApiFields, handleMappingChange, unmatchedApiFields, newFields, handleMappingRemove }) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>AIS Field</TableCell>
          <TableCell>API Response Field</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(mapping).filter(([aisField, apiField]) => apiField).map(([aisField, apiField]) => (
          <TableRow key={aisField}>
            <TableCell>{aisField}</TableCell>
            <TableCell>
              <Autocomplete
                freeSolo
                options={sample ? Object.keys(sample) : []}
                value={apiField}
                onChange={(e, newValue) => handleMappingChange(aisField, newValue || '')}
                renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
              />
            </TableCell>
            <TableCell>
              <IconButton onClick={() => handleMappingRemove(aisField)} title="Remove Mapping">
                <Cancel />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

MappingTable.propTypes = {
  mapping: PropTypes.object.isRequired,
  sample: PropTypes.object,
  usedApiFields: PropTypes.array.isRequired,
  handleMappingChange: PropTypes.func.isRequired,
  unmatchedApiFields: PropTypes.array.isRequired,
  newFields: PropTypes.object.isRequired,
  handleMappingRemove: PropTypes.func.isRequired,
};

export default MappingTable;
