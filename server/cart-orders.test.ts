import { afterAll, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { cartItems, orderItems, orders, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const TEST_OPEN_ID = "vitest-cart-user";

async function ensureTestUser(role: "user" | "admin" = "user") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .insert(users)
    .values({ openId: TEST_OPEN_ID, name: "Vitest Cart User", role })
    .onDuplicateKeyUpdate({ set: { role } });
  const rows = await db.select().from(users).where(eq(users.openId, TEST_OPEN_ID)).limit(1);
  return rows[0]!;
}

function createContext(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

async function cleanupTestUser() {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(users).where(eq(users.openId, TEST_OPEN_ID)).limit(1);
  const u = rows[0];
  if (!u) return;
  const userOrders = await db.select().from(orders).where(eq(orders.userId, u.id));
  for (const o of userOrders) {
    await db.delete(orderItems).where(eq(orderItems.orderId, o.id));
  }
  await db.delete(orders).where(eq(orders.userId, u.id));
  await db.delete(cartItems).where(eq(cartItems.userId, u.id));
  await db.delete(users).where(eq(users.id, u.id));
}

afterAll(async () => {
  await cleanupTestUser();
});

describe("cart full flow (add / update quantity / remove / subtotal)", () => {
  it("supports the complete cart lifecycle", { timeout: 30000 }, async () => {
    const dbUser = await ensureTestUser("user");
    const caller = appRouter.createCaller(createContext(dbUser as AuthenticatedUser));

    // Start clean
    await caller.cart.clear();
    expect(await caller.cart.get()).toHaveLength(0);

    // Pick two real products
    const products = await caller.products.list({});
    const p1 = products[0]!.product;
    const p2 = products[1]!.product;

    // Add two items
    await caller.cart.add({ productId: p1.id, size: "M", quantity: 2 });
    await caller.cart.add({ productId: p2.id, size: "L", quantity: 1 });
    let cart = await caller.cart.get();
    expect(cart).toHaveLength(2);

    // Adding same product+size merges quantity
    await caller.cart.add({ productId: p1.id, size: "M", quantity: 1 });
    cart = await caller.cart.get();
    expect(cart).toHaveLength(2);
    const row1 = cart.find(r => r.product.id === p1.id && r.item.size === "M")!;
    expect(row1.item.quantity).toBe(3);

    // Subtotal calculation matches expected
    const subtotal = cart.reduce((s, r) => s + r.product.priceCents * r.item.quantity, 0);
    expect(subtotal).toBe(p1.priceCents * 3 + p2.priceCents * 1);

    // Update quantity
    await caller.cart.updateQuantity({ itemId: row1.item.id, quantity: 5 });
    cart = await caller.cart.get();
    expect(cart.find(r => r.item.id === row1.item.id)!.item.quantity).toBe(5);

    // Setting quantity to 0 removes the item
    await caller.cart.updateQuantity({ itemId: row1.item.id, quantity: 0 });
    cart = await caller.cart.get();
    expect(cart.find(r => r.item.id === row1.item.id)).toBeUndefined();

    // Remove remaining item
    const row2 = cart.find(r => r.product.id === p2.id)!;
    await caller.cart.remove({ itemId: row2.item.id });
    expect(await caller.cart.get()).toHaveLength(0);
  });
});

describe("checkout & orders", () => {
  it("creates a real Stripe Checkout Session when key is configured", { timeout: 30000 }, async () => {
    const dbUser = await ensureTestUser("user");
    const caller = appRouter.createCaller(createContext(dbUser as AuthenticatedUser));

    await caller.cart.clear();
    const products = await caller.products.list({});
    const p1 = products[0]!.product;
    await caller.cart.add({ productId: p1.id, size: "M", quantity: 1 });

    const result = await caller.orders.checkout({
      shippingName: "Stripe E2E Buyer",
      shippingAddress: "456 Payment Ave, Card City, CC 11111",
      origin: "https://example.com",
    });

    // With a valid key configured, we must get a live checkout URL + session id persisted
    expect(result.error).toBeNull();
    expect(result.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    const order = await caller.orders.byId({ orderId: result.orderId });
    expect(order.stripeSessionId).toMatch(/^cs_/);
    expect(order.status).toBe("pending");
  });

  it("marks order paid and clears cart on payment completion (webhook flow)", { timeout: 30000 }, async () => {
    const dbUser = await ensureTestUser("user");
    const caller = appRouter.createCaller(createContext(dbUser as AuthenticatedUser));

    // Create an order with an item in cart
    await caller.cart.clear();
    const products = await caller.products.list({});
    const p1 = products[2]!.product;
    await caller.cart.add({ productId: p1.id, size: "XL", quantity: 1 });
    const result = await caller.orders.checkout({
      shippingName: "Webhook Test Buyer",
      shippingAddress: "789 Hook St, Web City, WH 22222",
      origin: "https://example.com",
    });

    // Simulate what the checkout.session.completed webhook handler does
    const { markOrderPaid, clearCart, getOrderById } = await import("./db");
    const before = await getOrderById(result.orderId);
    expect(before!.status).toBe("pending");
    await markOrderPaid(result.orderId, "pi_test_simulated");
    await clearCart(dbUser.id);

    const after = await caller.orders.byId({ orderId: result.orderId });
    expect(after.status).toBe("paid");
    expect(after.stripePaymentIntentId).toBe("pi_test_simulated");
    expect(await caller.cart.get()).toHaveLength(0);
  });

  it("creates a pending order from cart (Stripe not configured fallback)", { timeout: 30000 }, async () => {
    const dbUser = await ensureTestUser("user");
    const caller = appRouter.createCaller(createContext(dbUser as AuthenticatedUser));

    await caller.cart.clear();
    const products = await caller.products.list({});
    const p1 = products[0]!.product;
    await caller.cart.add({ productId: p1.id, size: "S", quantity: 2 });

    const result = await caller.orders.checkout({
      shippingName: "Vitest Buyer",
      shippingPhone: "555-0100",
      shippingAddress: "123 Test Street, Test City, TS 00000",
      origin: "https://example.com",
    });

    expect(result.orderId).toBeGreaterThan(0);
    // Without Stripe keys configured we expect graceful fallback;
    // with keys configured we expect a checkout URL.
    if (result.error) {
      expect(result.error).toBe("STRIPE_NOT_CONFIGURED");
      expect(result.checkoutUrl).toBeNull();
    } else {
      expect(result.checkoutUrl).toBeTruthy();
    }

    // Order is persisted with correct totals and items
    const order = await caller.orders.byId({ orderId: result.orderId });
    expect(order.totalCents).toBe(p1.priceCents * 2);
    expect(order.shippingName).toBe("Vitest Buyer");
    expect(order.status).toBe("pending");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]!.quantity).toBe(2);
    expect(order.items[0]!.size).toBe("S");

    // Appears in "my orders"
    const mine = await caller.orders.mine();
    expect(mine.some(o => o.id === result.orderId)).toBe(true);

    // checkout with empty cart is rejected
    await caller.cart.clear();
    await expect(
      caller.orders.checkout({
        shippingName: "X",
        shippingAddress: "Y",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("blocks other users from reading someone else's order, admin can read & update status", { timeout: 30000 }, async () => {
    const dbUser = await ensureTestUser("user");
    const userCaller = appRouter.createCaller(createContext(dbUser as AuthenticatedUser));
    const mine = await userCaller.orders.mine();
    expect(mine.length).toBeGreaterThan(0);
    const orderId = mine[0]!.id;

    // A different regular user cannot read it
    const stranger: AuthenticatedUser = {
      ...(dbUser as AuthenticatedUser),
      id: dbUser.id + 999999,
      role: "user",
    };
    const strangerCaller = appRouter.createCaller(createContext(stranger));
    await expect(strangerCaller.orders.byId({ orderId })).rejects.toThrow();

    // Admin can list all orders and update status
    const admin: AuthenticatedUser = { ...(dbUser as AuthenticatedUser), role: "admin" };
    const adminCaller = appRouter.createCaller(createContext(admin));
    const all = await adminCaller.admin.listOrders();
    expect(all.some(o => o.id === orderId)).toBe(true);

    await adminCaller.admin.updateOrderStatus({ orderId, status: "cancelled" });
    const updated = await userCaller.orders.byId({ orderId });
    expect(updated.status).toBe("cancelled");
  });
});
