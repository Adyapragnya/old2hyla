import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import PropTypes from 'prop-types';

const UnmatchedFieldsTable = ({ unmatchedApiFields, mapping, handleMappingChange, handleNewFieldChange, newFields }) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>API Field</TableCell>
          <TableCell>Map to AIS Field</TableCell>
          <TableCell>Or Add as New</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {unmatchedApiFields.map((apiField) => {
          const isMapped = Object.values(mapping).includes(apiField);
          const isNewField = apiField in newFields;

          return (
            <TableRow key={apiField}>
              <TableCell>{apiField}</TableCell>
              <TableCell>
                <Autocomplete
                  freeSolo
                  options={Object.keys(mapping).filter((aisField) => !Object.values(mapping).includes(apiField))}
                  value={Object.entries(mapping).find(([k, v]) => v === apiField)?.[0] || ''}
                  onChange={(e, newValue) => handleMappingChange(newValue, apiField)}
                  renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                />
              </TableCell>
              <TableCell>
                <Button onClick={() => handleNewFieldChange(apiField)} disabled={isMapped || isNewField}>
                  Add to New
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

UnmatchedFieldsTable.propTypes = {
  unmatchedApiFields: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  handleMappingChange: PropTypes.func.isRequired,
  handleNewFieldChange: PropTypes.func.isRequired,
  newFields: PropTypes.object.isRequired,
};

export default UnmatchedFieldsTable;
