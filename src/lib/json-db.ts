import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "data", "db.json");

export interface PlanRow {
  id: number;
  name: string;
  price: number;
  discount_percent: number;
  duration_days: number;
  description: string;
}

export interface UserPlanRow {
  id: number;
  user_id: number;
  plan_id: number;
  purchased_at: string;
  expires_at: string;
  active: boolean;
}

interface DB {
  users: UserRow[];
  orders: OrderRow[];
  balance_logs: BalanceLogRow[];
  plans: PlanRow[];
  user_plans: UserPlanRow[];
  login_codes: LoginCodeRow[];
  settings: DBSettings;
  nextId: { users: number; orders: number; balance_logs: number; plans: number; user_plans: number };
}

export interface LoginCodeRow {
  code: string;
  discord_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  used: boolean;
}

export interface UserRow {
  id: number;
  username: string;
  password: string;
  email: string;
  display_name: string;
  avatar_url: string;
  balance: number;
  role: string;
  discord_id: string;
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

export interface DBSettings { markup: number; }
export interface BalanceLogRow {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  note: string;
  created_at: string;
}

function defaultDB(): DB {
  const hash = bcrypt.hashSync("admin123", 10);
  return {
    users: [
      { id: 1, username: "admin", password: hash, email: "konvyvip@gmail.com", display_name: "Admin", avatar_url: "", balance: 0, role: "admin", discord_id: "", created_at: new Date().toISOString() },
    ],
    orders: [],
    balance_logs: [],
    plans: [
      { id: 1, name: "Basic", price: 15, discount_percent: 15, duration_days: 30, description: "15% off purchases for 30 days" },
      { id: 2, name: "Silver", price: 25, discount_percent: 25, duration_days: 30, description: "25% off purchases for 30 days" },
      { id: 3, name: "Gold", price: 45, discount_percent: 40, duration_days: 30, description: "40% off purchases for 30 days" },
      { id: 4, name: "VIP", price: 75, discount_percent: 55, duration_days: 60, description: "55% off purchases for 60 days" },
    ],
    user_plans: [],
    login_codes: [],
    settings: { markup: 1.0 },
    nextId: { users: 2, orders: 1, balance_logs: 1, plans: 5, user_plans: 1 },
  };
}

let db: DB | null = null;
let lastLoadTime = 0;

function ensureDir() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): DB {
  ensureDir();
  if (!fs.existsSync(dbPath)) {
    const d = defaultDB();
    fs.writeFileSync(dbPath, JSON.stringify(d, null, 2), "utf-8");
    return d;
  }
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const data = JSON.parse(raw) as DB;
    let changed = false;
    if (!data.settings) { data.settings = { markup: 1.0 }; changed = true; }
    if (!data.plans || data.plans.length === 0) {
      data.plans = [
        { id: 1, name: "Basic", price: 5, discount_percent: 5, duration_days: 30, description: "5% off purchases for 30 days" },
        { id: 2, name: "Silver", price: 10, discount_percent: 10, duration_days: 30, description: "10% off purchases for 30 days" },
        { id: 3, name: "Gold", price: 20, discount_percent: 20, duration_days: 30, description: "20% off purchases for 30 days" },
        { id: 4, name: "VIP", price: 40, discount_percent: 35, duration_days: 60, description: "35% off purchases for 60 days" },
      ];
      changed = true;
    }
    if (!data.nextId.plans) { data.nextId.plans = 5; changed = true; }
    if (!data.nextId.user_plans) { data.nextId.user_plans = 1; changed = true; }
    if (!data.user_plans) { data.user_plans = []; changed = true; }
    if (!data.login_codes) { data.login_codes = []; changed = true; }
    if (changed) fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    return data;
  } catch {
    const d = defaultDB();
    fs.writeFileSync(dbPath, JSON.stringify(d, null, 2), "utf-8");
    return d;
  }
}

function save() {
  ensureDir();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export function reloadDb() { db = null; return getDb(); }

export function getDb() {
  // Reload if file was modified (syncs across workers)
  try {
    const mtime = fs.statSync(dbPath).mtimeMs;
    if (!db || mtime > lastLoadTime) {
      db = load();
      lastLoadTime = mtime;
    }
  } catch {
    if (!db) db = load();
  }
  return {
    users: {
      findById: (id: number): UserRow | undefined => db!.users.find((u) => u.id === id),
      findByUsername: (username: string): UserRow | undefined => db!.users.find((u) => u.username === username),
      findByDiscordId: (discord_id: string): UserRow | undefined => db!.users.find((u) => u.discord_id === discord_id),
      all: (): UserRow[] => db!.users,
      create: (username: string, password: string, email: string, display_name: string): UserRow => {
        const id = db!.nextId.users++;
        const user: UserRow = { id, username, password, email, display_name, avatar_url: "", balance: 0, role: "user", discord_id: "", created_at: new Date().toISOString() };
        db!.users.push(user);
        save();
        return user;
      },
      update: (id: number, fields: Partial<UserRow>) => {
        const idx = db!.users.findIndex((u) => u.id === id);
        if (idx !== -1) { Object.assign(db!.users[idx], fields); save(); }
      },
    },
    orders: {
      create: (user_id: number, item_id: number, title: string | null, price: number | null, currency: string | null, credentials: string | null): OrderRow => {
        const id = db!.nextId.orders++;
        const order: OrderRow = { id, user_id, item_id, title, price, currency, credentials, status: "completed", created_at: new Date().toISOString() };
        db!.orders.push(order);
        save();
        return order;
      },
      findByUser: (userId: number): OrderRow[] => db!.orders.filter((o) => o.user_id === userId).reverse(),
      all: (): OrderRow[] => [...db!.orders].reverse(),
    },
    balance_logs: {
      create: (user_id: number, amount: number, type: string, note: string) => {
        const id = db!.nextId.balance_logs++;
        db!.balance_logs.push({ id, user_id, amount, type, note, created_at: new Date().toISOString() });
        save();
      },
      findByUser: (userId: number): BalanceLogRow[] => db!.balance_logs.filter((l) => l.user_id === userId).reverse().slice(0, 100),
    },
    settings: {
      get: (): DBSettings => db!.settings,
      update: (s: Partial<DBSettings>) => { Object.assign(db!.settings, s); save(); },
    },
    plans: {
      all: (): PlanRow[] => db!.plans,
      create: (plan: Omit<PlanRow, "id">): PlanRow => {
        const id = db!.nextId.plans++;
        const p: PlanRow = { id, ...plan };
        db!.plans.push(p); save(); return p;
      },
      update: (id: number, fields: Partial<PlanRow>) => {
        const idx = db!.plans.findIndex((p) => p.id === id);
        if (idx !== -1) { Object.assign(db!.plans[idx], fields); save(); }
      },
      delete: (id: number) => {
        db!.plans = db!.plans.filter((p) => p.id !== id); save();
      },
    },
    user_plans: {
      create: (user_id: number, plan_id: number, expires_at: string): UserPlanRow => {
        const id = db!.nextId.user_plans++;
        const up: UserPlanRow = { id, user_id, plan_id, purchased_at: new Date().toISOString(), expires_at, active: true };
        db!.user_plans.push(up); save(); return up;
      },
      activeForUser: (userId: number): UserPlanRow | undefined => {
        return db!.user_plans.find((up) => up.user_id === userId && up.active && new Date(up.expires_at) > new Date());
      },
      all: (): UserPlanRow[] => [...db!.user_plans].reverse(),
      deactivateExpired: () => {
        const now = Date.now();
        let changed = false;
        for (const up of db!.user_plans) {
          if (up.active && new Date(up.expires_at).getTime() < now) { up.active = false; changed = true; }
        }
        if (changed) save();
      },
    },
    login_codes: {
      create: (code: string, discord_id: string, username = "", display_name = "", avatar_url = "") => {
        db!.login_codes.push({ code, discord_id, username, display_name, avatar_url, created_at: new Date().toISOString(), used: false });
        save();
      },
      findAndUse: (code: string): { discord_id: string; username: string; display_name: string; avatar_url: string } | null => {
        const entry = db!.login_codes.find((l) => l.code === code && !l.used);
        if (!entry) return null;
        if (Date.now() - new Date(entry.created_at).getTime() > 5 * 60 * 1000) return null;
        entry.used = true;
        save();
        return { discord_id: entry.discord_id, username: entry.username, display_name: entry.display_name, avatar_url: entry.avatar_url };
      },
    },
    getUserDiscount: (userId: number): number => {
      const active = db!.user_plans.find((up) => up.user_id === userId && up.active && new Date(up.expires_at) > new Date());
      if (!active) return 0;
      const plan = db!.plans.find((p) => p.id === active.plan_id);
      return plan?.discount_percent || 0;
    },
    save,
  };
}
