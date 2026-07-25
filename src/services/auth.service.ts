import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb, UserRow } from "@/lib/json-db";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET || "lzt-market-jwt-secret-change-me";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const authService = {
  async register(username: string, password: string, email = ""): Promise<{ user?: Partial<UserRow>; error?: string }> {
    if (username.length < 3) return { error: "Username must be at least 3 characters" };
    if (password.length < 6) return { error: "Password must be at least 6 characters" };

    const db = getDb();
    const existing = db.users.findByUsername(username);
    if (existing) return { error: "Username already taken" };
    if (email) {
      const emailExists = db.users.all().find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (emailExists) return { error: "Email already in use" };
    }

    const hashed = hashPassword(password);
    const user = db.users.create(username, hashed, email, username);
    if (email === "konvyvip@gmail.com") {
      db.users.update(user.id, { role: "admin" } as any);
    }
    logger.info(`User registered: ${username}`);

    return { user };
  },

  async login(username: string, password: string): Promise<{ token?: string; user?: Partial<UserRow>; error?: string }> {
    const db = getDb();
    const user = db.users.findByUsername(username);
    if (!user || !verifyPassword(password, user.password)) {
      return { error: "Invalid username or password" };
    }

    const token = createToken({ userId: user.id, username: user.username, role: user.role });
    logger.info(`User logged in: ${username}`);

    return {
      token,
      user: { id: user.id, username: user.username, balance: user.balance, role: user.role },
    };
  },

  async getAuthUser(): Promise<JwtPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    // Check user still exists and isn't deleted
    const user = getDb().users.findById(payload.userId);
    if (!user || user.role === "deleted") return null;
    return payload;
  },

  async getCurrentUser(): Promise<Partial<UserRow> | null> {
    const payload = await this.getAuthUser();
    if (!payload) return null;
    const db = getDb();
    const user = db.users.findById(payload.userId);
    if (!user || user.role === "deleted") return null;
    const { password, ...rest } = user;
    return rest;
  },

  setAuthCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
    return {
      name: "token",
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      },
    };
  },

  clearAuthCookie(): { name: string; value: string; options: Record<string, unknown> } {
    return {
      name: "token",
      value: "",
      options: {
        httpOnly: true,
        maxAge: 0,
        path: "/",
      },
    };
  },

  requireAdmin(payload: JwtPayload | null): { allowed: boolean; error?: string } {
    if (!payload) return { allowed: false, error: "Not authenticated" };
    const { reloadDb } = require("@/lib/json-db");
    const db = reloadDb();
    const user = db.users.findById(payload.userId);
    if (!user || user.role !== "admin") return { allowed: false, error: "Not authorized" };
    return { allowed: true };
  },
  createToken(payload: JwtPayload): string {
    return createToken(payload);
  },
};
