-- Migration number: 0003 	 2025-07-25T00:00:00.000Z
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert launch date 30 days from migration date (2025-08-24)
INSERT INTO config (key, value) VALUES ('web_launch_date', '2025-08-24T00:00:00.000Z');