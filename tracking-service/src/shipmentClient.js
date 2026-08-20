const axios = require('axios');
const logger = require('./logger');
const { ApiError } = require('./middleware/errorHandler');

const SHIPMENT_SERVICE_URL = process.env.SHIPMENT_SERVICE_URL || 'http://localhost:4002';

/**
 * Calls the Python/FastAPI Shipment Service to confirm a tracking number
 * corresponds to a real shipment before logging tracking events. This is
 * the Node.js <-> Python REST interoperability boundary.
 */
async function validateShipmentExists(trackingNumber, bearerToken) {
  try {
    const resp = await axios.get(
      `${SHIPMENT_SERVICE_URL}/shipments/tracking/${trackingNumber}`,
      { headers: { Authorization: `Bearer ${bearerToken}` }, timeout: 5000 }
    );
    return { data: resp.data, status: resp.status };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      throw new ApiError(400, `No shipment found with tracking number ${trackingNumber}`);
    }
    logger.error(`Shipment Service unreachable: ${err.message}`);
    throw new ApiError(503, 'Shipment Service is currently unavailable');
  }
}

module.exports = { validateShipmentExists };
