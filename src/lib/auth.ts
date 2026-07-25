import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb, UserRow } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "lzt-market-secret-key-change-in-production";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function findUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export async function getAuthUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function createUser(username: string, password: string): UserRow {
  const db = getDb();
  const hashed = hashPassword(password);
  const result = db.prepare("INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)").run(username, hashed, username);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as UserRow;
}
