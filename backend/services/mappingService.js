import axios from 'axios';
import TrackedVessel from '../models/TrackedVessel.js';

export const getRandomTrackedVesselIMO = async () => {
  const [sample] = await TrackedVessel.aggregate([{ $sample: { size: 1 } }]);
  return sample?.IMO;
};

export const fetchVesselData = async (url, apiKey, imo, apiType = 'vtexplorer') => {
  const headers = {};
  const params = {};

  if (apiType === 'lloyds') {
    headers['Authorization'] = `${apiKey}`;
    params['vesselImo'] = imo;
  } else {
    params['userkey'] = apiKey;
    params['imo'] = imo;
    params['format'] = 'json';
    params['sat'] = '1';
  }

  try {
    const response = await axios.get(url, { headers, params });
    console.log(response);

    // Lloyds wraps AIS in a nested structure
    if (apiType === 'lloyds') {
      const aisData = response.data?.Data?.AisPositions?.[0];
      return aisData || {};
    }

    // VTExplorer returns an array
    if (Array.isArray(response.data)) {
      return response.data[0]?.AIS || {};
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching vessel data:', error.response?.data || error.message);
    throw error;
  }
};


const flattenKeys = (obj, prefix = '') => {
  let keys = [];

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;  // Full path is tracked

    if (typeof value === 'string' && value.includes('=') && value.includes(',')) {
      // Handling dimensions-like fields (example: 'key=dimValue')
      value.split(',').forEach(part => {
        const [dimKey] = part.split('=').map(s => s.trim());
        keys.push(`${fullKey}.${dimKey}`); // Keep full path including dimension keys
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      keys = keys.concat(flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);  // Add full path to the key
    }
  }

  return keys;
};




const detectType = (value) => {
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return 'Number';
  if (!isNaN(Date.parse(value))) return 'Date';
  return 'String';
};

const getValueFromPath = (obj, path) => {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
};

const normalize = str => {
  return str
    .toString()
    .toLowerCase()
    .replace(/[_\-]/g, ' ')                // replace underscores/hyphens
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase to words
    .replace(/s$/, '')                    // plural
    .replace(/[^a-z0-9 ]/g, '')           // non-alphanum
    .trim();
};

const getLastPathComponent = path => path.split('.').pop();

export const suggestMapping = (apiData, aisFieldList) => {
  const responseFields = flattenKeys(apiData); // Flattened keys (full paths)
  const mapping = {};
  const unmatchedApiFields = [];
  const newFields = {};
  const used = new Set();

  for (const aisField of aisFieldList) {
    // Match by normalized full path
    const apiMatch = responseFields.find(apiPath =>
      normalize(apiPath) === normalize(aisField) ||   // Exact full path match
      normalize(getLastPathComponent(apiPath)) === normalize(aisField) // Fallback to last path component
    );

    if (apiMatch) {
      mapping[aisField] = apiMatch;  // Store the full path
      used.add(apiMatch);
    } else {
      mapping[aisField] = ''; // No match found
    }
  }

  // Collect unmatched API fields (full paths)
  for (const apiPath of responseFields) {
    if (!used.has(apiPath)) {
      unmatchedApiFields.push(apiPath); // Keep full path
    }
  }

  return { mapping, unmatchedApiFields, newFields };
};

