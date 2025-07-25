-- Migration number: 0001 	 2025-06-19T18:13:02.648Z
-- DEPRECATED: Tasks table no longer used
-- Kept for migration history consistency
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    completed INTEGER NOT NULL,
    due_date DATETIME NOT NULL
);