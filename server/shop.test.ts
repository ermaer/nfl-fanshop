import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "user" | "admin" | null): TrpcContext {
  const user: AuthenticatedUser | null = role
    ? {
        id: role === "admin" ? 999 : 998,
        openId: `test-${role}`,
        email: `${role}@test.com`,
        name: `Test ${role}`,
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("teams.list", () => {
  it("returns all 32 NFL teams", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const teams = await caller.teams.list();
    expect(teams).toHaveLength(32);
    const abbrs = teams.map(t => t.abbreviation);
    expect(abbrs).toContain("KC");
    expect(abbrs).toContain("SF");
    expect(abbrs).toContain("DAL");
  });
});

describe("products.list", () => {
  it("returns 64 products (32 teams x 2 types)", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const products = await caller.products.list({});
    expect(products.length).toBeGreaterThanOrEqual(64);
  });

  it("filters by product type", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const tshirts = await caller.products.list({ productType: "tshirt" });
    expect(tshirts.length).toBeGreaterThanOrEqual(32);
    expect(tshirts.every(r => r.product.productType === "tshirt")).toBe(true);
  });

  it("filters by team", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const teams = await caller.teams.list();
    const kc = teams.find(t => t.abbreviation === "KC")!;
    const rows = await caller.products.list({ teamId: kc.id });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every(r => r.product.teamId === kc.id)).toBe(true);
  });

  it("searches by keyword", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const rows = await caller.products.list({ search: "Chiefs" });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every(r => r.product.name.toLowerCase().includes("chiefs"))).toBe(true);
  });

  it("every product has an AI-generated image", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const rows = await caller.products.list({});
    const seeded = rows.filter(r => r.product.id <= 64);
    expect(seeded.every(r => !!r.product.imageUrl)).toBe(true);
  });
});

describe("cart", () => {
  it("rejects unauthenticated cart access", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.cart.get()).rejects.toThrow();
  });
});

describe("admin authorization", () => {
  it("rejects non-admin from creating products", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.admin.createProduct({
        teamId: 1,
        name: "Test Product",
        productType: "tshirt",
        priceCents: 1999,
        inStock: true,
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated admin order listing", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.admin.listOrders()).rejects.toThrow();
  });

  it("allows admin to create, update and delete a product", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const created = await caller.admin.createProduct({
      teamId: 1,
      name: "VITEST TEMP PRODUCT",
      productType: "tshirt",
      priceCents: 1234,
      inStock: true,
    });
    expect(created.id).toBeGreaterThan(0);

    await caller.admin.updateProduct({ id: created.id, priceCents: 5678, inStock: false });
    const fetched = await caller.products.byId({ id: created.id });
    expect(fetched?.product.priceCents).toBe(5678);
    expect(fetched?.product.inStock).toBe(false);

    await caller.admin.deleteProduct({ id: created.id });
    await expect(caller.products.byId({ id: created.id })).rejects.toThrow("Product not found");
  });
});

describe("orders.stripeStatus", () => {
  it("reports stripe configuration status", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const status = await caller.orders.stripeStatus();
    expect(typeof status.configured).toBe("boolean");
  });
});
