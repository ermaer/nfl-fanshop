import { and, asc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { cartItems, InsertProduct, InsertUser, orderItems, orders, products, teams, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---------- Teams ----------
export async function listTeams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).orderBy(asc(teams.conference), asc(teams.division), asc(teams.city));
}

export async function getTeamByAbbr(abbr: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teams).where(eq(teams.abbreviation, abbr)).limit(1);
  return rows[0];
}

// ---------- Products ----------
export async function listProducts(filters: { teamId?: number; productType?: "tshirt" | "dress"; search?: string; includeOutOfStock?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (filters.teamId) conds.push(eq(products.teamId, filters.teamId));
  if (filters.productType) conds.push(eq(products.productType, filters.productType));
  if (filters.search) {
    const kw = `%${filters.search}%`;
    conds.push(or(like(products.name, kw), like(products.description, kw)));
  }
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select({ product: products, team: teams })
    .from(products)
    .innerJoin(teams, eq(products.teamId, teams.id))
    .where(where)
    .orderBy(asc(teams.city), asc(products.productType));
  return rows;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ product: products, team: teams })
    .from(products)
    .innerJoin(teams, eq(products.teamId, teams.id))
    .where(eq(products.id, id))
    .limit(1);
  return rows[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(products).values(data);
  return { id: result[0].insertId };
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(products).where(eq(products.id, id));
  await db.delete(cartItems).where(eq(cartItems.productId, id));
}

// ---------- Cart ----------
export async function getCart(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ item: cartItems, product: products, team: teams })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(teams, eq(products.teamId, teams.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt));
}

export async function addToCart(userId: number, productId: number, size: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId), eq(cartItems.size, size)))
    .limit(1);
  if (existing[0]) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, size, quantity });
  }
}

export async function updateCartItem(userId: number, itemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));
  }
}

export async function removeCartItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ---------- Orders ----------
export async function createOrder(data: {
  userId: number;
  totalCents: number;
  shippingName: string;
  shippingPhone?: string;
  shippingAddress: string;
  items: { productId: number; productName: string; productImageUrl: string | null; size: string; quantity: number; unitPriceCents: number }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(orders).values({
    userId: data.userId,
    totalCents: data.totalCents,
    shippingName: data.shippingName,
    shippingPhone: data.shippingPhone ?? null,
    shippingAddress: data.shippingAddress,
    status: "pending",
  });
  const orderId = Number((result as unknown as [{ insertId: number }])[0].insertId);
  await db.insert(orderItems).values(data.items.map(it => ({ ...it, orderId })));
  return orderId;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows[0]) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...rows[0], items };
}

export async function listOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(asc(orders.createdAt));
  const result = [];
  for (const o of rows.reverse()) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    result.push({ ...o, items });
  }
  return result;
}

export async function listAllOrders() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).orderBy(asc(orders.createdAt));
  const result = [];
  for (const o of rows.reverse()) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    result.push({ ...o, items });
  }
  return result;
}

export async function updateOrderStripeInfo(orderId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ stripeSessionId: sessionId }).where(eq(orders.id, orderId));
}

export async function markOrderPaid(orderId: number, paymentIntentId: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ status: "paid", stripePaymentIntentId: paymentIntentId }).where(eq(orders.id, orderId));
}

export async function markOrderStatus(orderId: number, status: "pending" | "paid" | "failed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

// ── News Articles ──────────────────────────────────────────────────────

import { newsArticles } from "../drizzle/schema";
import type { InsertNewsArticle } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function listNewsArticles(params?: { category?: string; teamId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(newsArticles.isPublished, true)];
  if (params?.category) conditions.push(eq(newsArticles.category, params.category as any));
  if (params?.teamId) conditions.push(eq(newsArticles.teamId!, params.teamId));
  return db.select().from(newsArticles).where(and(...conditions)).orderBy(desc(newsArticles.publishedAt)).limit(params?.limit ?? 20);
}

export async function getNewsArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(newsArticles).where(eq(newsArticles.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getNewsArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(newsArticles).where(eq(newsArticles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createNewsArticle(data: InsertNewsArticle) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(newsArticles).values(data);
  return { success: true } as const;
}

export async function updateNewsArticle(id: number, data: Partial<InsertNewsArticle>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(newsArticles).set(data).where(eq(newsArticles.id, id));
  return { success: true } as const;
}

export async function deleteNewsArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(newsArticles).where(eq(newsArticles.id, id));
  return { success: true } as const;
}

export async function listAllNewsArticles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsArticles).orderBy(desc(newsArticles.createdAt));
}
