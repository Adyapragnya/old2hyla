import AisSatPull from './models/AisSatPull.js';

/**
 * Fetch satellite interval configuration for a given role from DB.
 * @param {string} role - Role name (e.g., 'hyla admin', 'guest')
 * @returns {Promise<{sat0: number, sat1a: number, sat1b: number}>}
 */
export async function getRoleBasedInterval(role) {
  if (!role) {
    console.warn(`getRoleBasedInterval called with empty role.`);
    return defaultFallback();
  }

  const normalizedRole = role.trim().toLowerCase();

  try {
    const record = await AisSatPull.findOne({ roleType: normalizedRole });

    if (!record) {
      console.warn(`No DB interval config found for role '${normalizedRole}', using fallback.`);
      return defaultFallback();
    }

    return {
      sat0: record.sat0,
      sat1a: record.sat1a,
      sat1b: record.sat1b,
    };
  } catch (error) {
    console.error(`Error fetching interval for role '${normalizedRole}':`, error);
    return defaultFallback();
  }
}

/**
 * Hardcoded fallback in case of DB failure or missing role config.
 */
function defaultFallback() {
  return {
    sat0: 6 * 60 * 60 * 1000,    // 6 hours
    sat1a: 12 * 60 * 60 * 1000,  // 12 hours
    sat1b: 24 * 60 * 60 * 1000,  // 24 hours
  };
}
