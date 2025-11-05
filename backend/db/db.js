import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function initDB() {
  if (db) return db;

  db = await open({
    filename: './data.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS callers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      name TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS help_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caller_id INTEGER,
      question_text TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      timeout_at DATETIME,
      supervisor_id TEXT,
      resolution_text TEXT,
      FOREIGN KEY (caller_id) REFERENCES callers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_pattern TEXT,
      answer_text TEXT,
      created_from_request_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_from_request_id) REFERENCES help_requests(id)
    );
  `);

  console.log('Database initialized');
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}
