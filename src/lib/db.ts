import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "market.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT DEFAULT '',
      display_name TEXT,
      avatar_url TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      title TEXT,
      price REAL,
      currency TEXT,
      credentials TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS balance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Add columns if they don't exist (for existing databases)
  try { db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''"); } catch { /* already exists */ }
  try { db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"); } catch { /* already exists */ }
}

export interface UserRow {
  id: number;
  username: string;
  password: string;
  email: string;
  display_name: string | null;
  avatar_url: string;
  balance: number;
  role: string;
  created_at: string;
}

export interface OrderRow {
  id: number;
  user_id: number;
  item_id: number;
  title: string | null;
  price: number | null;
  currency: string | null;
  credentials: string | null;
  status: string;
  created_at: string;
}
