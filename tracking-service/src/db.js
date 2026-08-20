const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dbDir, 'tracking.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tracking_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN
      ('PICKED_UP','IN_TRANSIT','ARRIVED_AT_HUB','OUT_FOR_DELIVERY','DELIVERED','EXCEPTION')),
    latitude REAL,
    longitude REAL,
    location_label TEXT,
    notes TEXT,
    recorded_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tracking_number ON tracking_events(tracking_number);
`);

module.exports = db;
