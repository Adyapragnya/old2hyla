import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, IconButton } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import PropTypes from 'prop-types';

const NewFieldsTable = ({ newFields, setNewFields, removeNewField, mapping, unmatchedApiFields }) => {
  const allUsedFields = new Set([
    ...Object.keys(mapping),
    ...Object.values(mapping),
    ...unmatchedApiFields,
  ]);

  return (
    <Table size="small">
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
              <IconButton onClick={() => removeNewField(apiField)} disabled={allUsedFields.has(apiField)}>
                <Cancel />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

NewFieldsTable.propTypes = {
  newFields: PropTypes.object.isRequired,
  setNewFields: PropTypes.func.isRequired,
  removeNewField: PropTypes.func.isRequired,
  mapping: PropTypes.object.isRequired,
  unmatchedApiFields: PropTypes.array.isRequired,
};

export default NewFieldsTable;
