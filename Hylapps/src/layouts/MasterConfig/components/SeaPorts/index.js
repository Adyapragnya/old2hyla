import React, { useState } from 'react';
import axios from 'axios';

function SeaPorts() {
  const [query, setQuery] = useState('');
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [unlocode, setUnlocode] = useState('');
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const searchPorts = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/sea-ports/search?q=${query}`);
      setPorts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (port) => {
    setSelectedPort(port);
    setUnlocode(port.LOCODE || '');
  };

  const submitPort = async () => {
    if (!selectedPort || !unlocode) return alert('Missing data');

    try {
      const res = await axios.post(`${baseURL}/api/sea-ports/add`, {
        id: selectedPort._id,
        UNLOCODE: unlocode
      });
      alert('Port added successfully');
      console.log(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add port');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Search & Submit Port</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          placeholder="Enter port name or LOCODE"
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
        <button
          onClick={searchPorts}
          style={{
            padding: '10px 16px',
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
        {ports.map(port => (
          <li
            key={port._id}
            onClick={() => handleSelect(port)}
            style={{
              padding: '10px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              backgroundColor: selectedPort?._id === port._id ? '#e6f7ff' : 'transparent'
            }}
          >
            <strong>{port.PORT_NAME}</strong> ({port.COUNTRY}) - LOCODE: {port.LOCODE || 'N/A'}
          </li>
        ))}
      </ul>

      {selectedPort && (
        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px' }}>Selected Port: {selectedPort.PORT_NAME}</h4>
          <input
            type="text"
            value={unlocode}
            placeholder="Enter UN LOCODE"
            onChange={(e) => setUnlocode(e.target.value)}
            style={{
              padding: '10px',
              width: '100%',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <button
            onClick={submitPort}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Add Port
          </button>
        </div>
      )}
    </div>
  );
}

export default SeaPorts;
