import { getDb } from "@/lib/json-db";
import { logger } from "@/lib/logger";

export const walletService = {
  getBalance(userId: number): number {
    const user = getDb().users.findById(userId);
    return user?.balance || 0;
  },

  hasSufficientFunds(userId: number, amount: number): boolean {
    return this.getBalance(userId) >= amount;
  },

  deduct(userId: number, amount: number, note: string): boolean {
    const db = getDb();
    const balance = this.getBalance(userId);
    if (balance < amount) return false;

    db.users.update(userId, { balance: balance - amount });
    db.balance_logs.create(userId, -amount, "purchase", note);
    logger.info(`Wallet deduction: user=${userId} amount=${amount}`, { note });
    return true;
  },

  deposit(userId: number, amount: number, note: string): void {
    const db = getDb();
    const user = db.users.findById(userId);
    if (!user) return;
    db.users.update(userId, { balance: (user.balance || 0) + amount });
    db.balance_logs.create(userId, amount, "deposit", note);
    logger.info(`Wallet deposit: user=${userId} amount=${amount}`, { note });
  },

  refund(userId: number, amount: number, note: string): void {
    this.deposit(userId, amount, `Refund: ${note}`);
    logger.info(`Wallet refund: user=${userId} amount=${amount}`, { note });
  },

  getHistory(userId: number): Record<string, unknown>[] {
    return getDb().balance_logs.findByUser(userId) as unknown as Record<string, unknown>[];
  },
};
