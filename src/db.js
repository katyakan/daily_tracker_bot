import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/tracker.db';

// Создаём папку data, если её нет
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS calories (
  chat_id TEXT NOT NULL,
  date TEXT NOT NULL,
  intake INTEGER DEFAULT 0,
  burn INTEGER DEFAULT 0,
  PRIMARY KEY (chat_id, date)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  minutes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS weight (
  chat_id TEXT NOT NULL,
  date TEXT NOT NULL,
  value REAL NOT NULL,
  PRIMARY KEY (chat_id, date)
);

CREATE TABLE IF NOT EXISTS career (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  company TEXT NOT NULL
);

-- Удаляем старую таблицу и создаём новую
DROP TABLE IF EXISTS goals;

CREATE TABLE goals (
  chat_id TEXT NOT NULL,
  type TEXT NOT NULL,
  activity TEXT NOT NULL,
  target INTEGER NOT NULL,
  created_date TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_date TEXT,
  PRIMARY KEY (chat_id, type, activity)
);
`);

export default db;







