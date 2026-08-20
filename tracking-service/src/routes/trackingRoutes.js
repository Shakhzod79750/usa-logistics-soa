const express = require('express');
const db = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { validateShipmentExists } = require('../shipmentClient');
const logger = require('../logger');

const router = express.Router();
const VALID_EVENTS = ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'];

/**
 * @swagger
 * /tracking/events:
 *   post:
 *     summary: Log a new tracking event for a shipment
 *     tags: [Tracking]
 */
router.post('/events', authenticate, authorize('admin', 'dispatcher', 'driver'), async (req, res, next) => {
  try {
    const { tracking_number, event_type, latitude, longitude, location_label, notes } = req.body;
    if (!tracking_number || !event_type) throw new ApiError(400, 'tracking_number and event_type are required');
    if (!VALID_EVENTS.includes(event_type)) throw new ApiError(400, `event_type must be one of: ${VALID_EVENTS.join(', ')}`);

    const trace = [
      { from_service: 'browser', to_service: 'tracking-service', method: 'POST', path: '/tracking/events', note: 'JWT verified locally by tracking-service (Node.js)' },
      { from_service: 'tracking-service', to_service: 'shipment-service', method: 'GET', path: `/shipments/tracking/${tracking_number}`, note: 'validating tracking number [Node.js -> Python]' },
    ];

    // Cross-service, cross-language validation: Tracking (Node.js) -> Shipment (Python/FastAPI)
    const token = req.headers['authorization'].split(' ')[1];
    const { status: shipStatus } = await validateShipmentExists(tracking_number, token);
    trace.push({ from_service: 'shipment-service', to_service: 'tracking-service', method: 'RESPONSE', path: `/shipments/tracking/${tracking_number}`, status: shipStatus, note: 'shipment validated' });

    const info = db
      .prepare(
        `INSERT INTO tracking_events
         (tracking_number, event_type, latitude, longitude, location_label, notes, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(tracking_number, event_type, latitude || null, longitude || null, location_label || null, notes || null, parseInt(req.user.sub, 10));

    trace.push({ from_service: 'tracking-service', to_service: 'tracking-db', method: 'INSERT', path: 'tracking_events', note: 'event persisted' });
    trace.push({ from_service: 'tracking-service', to_service: 'browser', method: 'RESPONSE', path: '/tracking/events', status: 201, note: 'event logged' });

    logger.info(`Tracking event logged for ${tracking_number}: ${event_type}`);
    const event = db.prepare('SELECT * FROM tracking_events WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ ...event, trace });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /tracking/{trackingNumber}:
 *   get:
 *     summary: Get full tracking history for a shipment
 *     tags: [Tracking]
 */
router.get('/:trackingNumber', authenticate, (req, res) => {
  const events = db
    .prepare('SELECT * FROM tracking_events WHERE tracking_number = ? ORDER BY created_at ASC')
    .all(req.params.trackingNumber);
  res.json(events);
});

/**
 * @swagger
 * /tracking/{trackingNumber}/latest:
 *   get:
 *     summary: Get the most recent tracking event for a shipment
 *     tags: [Tracking]
 */
router.get('/:trackingNumber/latest', authenticate, (req, res, next) => {
  try {
    const event = db
      .prepare('SELECT * FROM tracking_events WHERE tracking_number = ? ORDER BY created_at DESC LIMIT 1')
      .get(req.params.trackingNumber);
    if (!event) throw new ApiError(404, 'No tracking events found for this shipment');
    res.json(event);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /tracking/events/{id}:
 *   delete:
 *     summary: Delete a tracking event (admin only)
 *     tags: [Tracking]
 */
router.delete('/events/:id', authenticate, authorize('admin'), (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM tracking_events WHERE id = ?').run(req.params.id);
    if (result.changes === 0) throw new ApiError(404, 'Tracking event not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
