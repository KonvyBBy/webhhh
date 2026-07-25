import { getDb } from "@/lib/json-db";
import { logger } from "@/lib/logger";
import { walletService } from "./wallet.service";
import { lztService } from "./lzt.service";

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  balance?: number;
  credentials?: Record<string, unknown>;
  error?: string;
}

export const orderService = {
  async purchase(userId: number, itemId: number | string): Promise<CreateOrderResult> {
    const db = getDb();

    try {
      const { item } = await lztService.getProductDetail(itemId);
      if (!item) {
        return { success: false, error: "Product not found on LZT Market" };
      }

      let price = Number(item.price) || 0;
      const title = (item.title as string) || `Item #${itemId}`;

      // Apply plan discount
      const discount = db.getUserDiscount(userId);
      const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

      if (!walletService.hasSufficientFunds(userId, finalPrice)) {
        return {
          success: false,
          error: `Insufficient balance. Required: $${finalPrice.toFixed(2)}`,
        };
      }

      const buyResult = await lztService.fastBuy(itemId);

      walletService.deduct(userId, finalPrice, `Purchased: ${title}${discount > 0 ? ` (${discount}% off)` : ""}`);

      let parsedCredentials: Record<string, unknown> = {};
      try {
        const itemData = (buyResult.item as Record<string, unknown>) || buyResult;
        const loginData = (itemData.loginData as Record<string, unknown>) || {};
        const emailData = (itemData.emailLoginData as Record<string, unknown>) || {};
        parsedCredentials = {
          game: itemData.title || "Account",
          login: itemData.login || loginData.login || "",
          password: loginData.password || "",
          email: emailData.login || "",
          emailPassword: emailData.password || "",
          emailOldPassword: emailData.oldPassword || "",
          emailSecretAnswer: emailData.newSecretAnswer || "",
          emailLoginUrl: emailData.emailLoginUrl || (itemData as Record<string, unknown>).emailLoginUrl || "",
          domain: (itemData as Record<string, unknown>).domain || "",
        };
      } catch {
        parsedCredentials = { raw: JSON.stringify(buyResult) };
      }

      const credentials = JSON.stringify(parsedCredentials);
      const order = db.orders.create(userId, Number(itemId), title, price, "$", credentials);

      const newBalance = walletService.getBalance(userId);

      logger.info(`Purchase successful: user=${userId} item=${itemId} price=${price}`, {
        orderId: order.id,
      });

      lztService.invalidateCache(`product:${itemId}`);

      return {
        success: true,
        orderId: order.id,
        balance: newBalance,
        credentials: parsedCredentials,
      };
    } catch (err) {
      logger.error(`Purchase failed: user=${userId} item=${itemId}`, { error: String(err) });
      return {
        success: false,
        error: `Purchase failed: ${String(err)}`,
      };
    }
  },

  async getOrders(userId: number): Promise<Record<string, unknown>[]> {
    return getDb().orders.findByUser(userId) as unknown as Record<string, unknown>[];
  },

  async getAllOrders(): Promise<Record<string, unknown>[]> {
    const db = getDb();
    return db.orders.all().map((o) => {
      const u = db.users.findById(o.user_id);
      return { ...o, buyer_username: u?.username || `User #${o.user_id}` };
    }) as unknown as Record<string, unknown>[];
  },
};
