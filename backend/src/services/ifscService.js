const axios = require('axios');

const RAZORPAY_IFSC_BASE = 'https://ifsc.razorpay.com';

/**
 * Look up an IFSC code via Razorpay's free public API.
 * Flow: Express (this service) → Razorpay → Express → caller
 * Browser NEVER calls Razorpay directly.
 *
 * @param {string} ifsc - The IFSC code to look up
 * @returns {Object} { BANK, BRANCH, CITY, ... } on success
 * @throws {Error} with .isInvalidIFSC = true on 404 / bad format
 */
const lookupIFSC = async (ifsc) => {
  try {
    const response = await axios.get(`${RAZORPAY_IFSC_BASE}/${ifsc.toUpperCase()}`, {
      timeout: 8000,
    });
    return response.data; // { BANK, IFSC, MICR, BRANCH, ADDRESS, CONTACT, CITY, ... }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Razorpay returns 404 for unknown / invalid IFSC
      const invalidErr = new Error(`Invalid IFSC code: ${ifsc}. Bank not found.`);
      invalidErr.isInvalidIFSC = true;
      throw invalidErr;
    }
    // Network or timeout error
    console.error('[IFSC] Razorpay API error:', err.message);
    throw new Error('IFSC lookup failed. Please try again later.');
  }
};

module.exports = { lookupIFSC };
