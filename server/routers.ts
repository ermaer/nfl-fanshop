import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import type { InsertNewsArticle } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getStripe, isStripeConfigured } from "./stripe";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  teams: router({
    list: publicProcedure.query(() => db.listTeams()),
  }),

  products: router({
    list: publicProcedure
      .input(
        z.object({
          teamId: z.number().optional(),
          productType: z.enum(["tshirt", "dress"]).optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(({ input }) => db.listProducts(input ?? {})),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const row = await db.getProductById(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      return row;
    }),
  }),

  cart: router({
    get: protectedProcedure.query(({ ctx }) => db.getCart(ctx.user.id)),
    add: protectedProcedure
      .input(z.object({ productId: z.number(), size: z.enum(SIZES), quantity: z.number().min(1).max(20) }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        if (!product.product.inStock) throw new TRPCError({ code: "BAD_REQUEST", message: "Product out of stock" });
        await db.addToCart(ctx.user.id, input.productId, input.size, input.quantity);
        return { success: true } as const;
      }),
    updateQuantity: protectedProcedure
      .input(z.object({ itemId: z.number(), quantity: z.number().min(0).max(20) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCartItem(ctx.user.id, input.itemId, input.quantity);
        return { success: true } as const;
      }),
    remove: protectedProcedure.input(z.object({ itemId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeCartItem(ctx.user.id, input.itemId);
      return { success: true } as const;
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true } as const;
    }),
  }),

  orders: router({
    stripeStatus: publicProcedure.query(() => ({ configured: isStripeConfigured() })),
    checkout: protectedProcedure
      .input(
        z.object({
          shippingName: z.string().min(1).max(128),
          shippingPhone: z.string().max(32).optional(),
          shippingAddress: z.string().min(1).max(1000),
          origin: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cart = await db.getCart(ctx.user.id);
        if (cart.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
        const totalCents = cart.reduce((sum, r) => sum + r.product.priceCents * r.item.quantity, 0);
        const orderId = await db.createOrder({
          userId: ctx.user.id,
          totalCents,
          shippingName: input.shippingName,
          shippingPhone: input.shippingPhone,
          shippingAddress: input.shippingAddress,
          items: cart.map(r => ({
            productId: r.product.id,
            productName: r.product.name,
            productImageUrl: r.product.imageUrl,
            size: r.item.size,
            quantity: r.item.quantity,
            unitPriceCents: r.product.priceCents,
          })),
        });

        const stripe = getStripe();
        if (!stripe) {
          return { orderId, checkoutUrl: null, error: "STRIPE_NOT_CONFIGURED" as const };
        }

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          metadata: { orderId: String(orderId) },
          line_items: cart.map(r => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: r.product.name,
                ...(r.product.imageUrl && r.product.imageUrl.startsWith("http")
                  ? { images: [r.product.imageUrl] }
                  : {}),
              },
              unit_amount: r.product.priceCents,
            },
            quantity: r.item.quantity,
          })),
          success_url: `${input.origin}/order-success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/checkout?cancelled=1`,
        });
        await db.updateOrderStripeInfo(orderId, session.id);
        return { orderId, checkoutUrl: session.url, error: null };
      }),
    syncStatus: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.orderId);
      if (!order || (order.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.status === "pending" && order.stripeSessionId) {
        const stripe = getStripe();
        if (stripe) {
          const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
          if (session.payment_status === "paid") {
            await db.markOrderPaid(order.id, (session.payment_intent as string) ?? null);
            await db.clearCart(order.userId);
          }
        }
      }
      return db.getOrderById(input.orderId);
    }),
    byId: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.orderId);
      if (!order || (order.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      return order;
    }),
    mine: protectedProcedure.query(({ ctx }) => db.listOrdersByUser(ctx.user.id)),
  }),

  admin: router({
    createProduct: adminProcedure
      .input(
        z.object({
          teamId: z.number(),
          name: z.string().min(1).max(255),
          description: z.string().max(2000).optional(),
          productType: z.enum(["tshirt", "dress"]),
          priceCents: z.number().min(1),
          imageUrl: z.string().optional(),
          inStock: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const created = await db.createProduct({
          teamId: input.teamId,
          name: input.name,
          description: input.description ?? null,
          productType: input.productType,
          priceCents: input.priceCents,
          imageUrl: input.imageUrl ?? null,
          inStock: input.inStock,
        });
        return { success: true, id: created.id } as const;
      }),
    updateProduct: adminProcedure
      .input(
        z.object({
          id: z.number(),
          teamId: z.number().optional(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().max(2000).optional(),
          productType: z.enum(["tshirt", "dress"]).optional(),
          priceCents: z.number().min(1).optional(),
          imageUrl: z.string().optional(),
          inStock: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true } as const;
      }),
    deleteProduct: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true } as const;
    }),
    uploadImage: adminProcedure
      .input(z.object({ base64: z.string(), fileName: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Image too large (max 10MB)" });
        }
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "png";
        const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
        const key = `products/${nanoid(10)}.${ext}`;
        const { url } = await storagePut(key, buffer, mime);
        return { url };
      }),
    listOrders: adminProcedure.query(() => db.listAllOrders()),
    updateOrderStatus: adminProcedure
      .input(z.object({ orderId: z.number(), status: z.enum(["pending", "paid", "failed", "cancelled"]) }))
      .mutation(async ({ input }) => {
        await db.markOrderStatus(input.orderId, input.status);
        return { success: true } as const;
      }),
  }),

  // ── News / Blog ──────────────────────────────────────────────────────

  news: router({
    /** Public: list published articles */
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        teamId: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
      }).optional())
      .query(({ input }) => db.listNewsArticles(input ?? {})),

    /** Public: get single article by slug */
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await db.getNewsArticleBySlug(input.slug);
        if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        return article;
      }),

    /** Admin: create article */
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
        excerpt: z.string().optional(),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        category: z.enum(["news", "guide", "team-spotlight", "draft", "free-agency", "season-preview"]).default("news"),
        teamId: z.number().optional(),
        authorName: z.string().default("NFL Fan Shop Editorial"),
        isPublished: z.boolean().default(false),
        publishedAt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createNewsArticle({
          ...input,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : (input.isPublished ? new Date() : null),
        });
      }),

    /** Admin: update article */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        excerpt: z.string().optional(),
        content: z.string().min(1).optional(),
        imageUrl: z.string().optional(),
        category: z.enum(["news", "guide", "team-spotlight", "draft", "free-agency", "season-preview"]).optional(),
        teamId: z.number().optional(),
        authorName: z.string().optional(),
        isPublished: z.boolean().optional(),
        publishedAt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Partial<InsertNewsArticle> = { ...data };
        if (input.publishedAt !== undefined) updateData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
        return db.updateNewsArticle(id, updateData);
      }),

    /** Admin: delete article */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => db.deleteNewsArticle(input.id)),

    /** Admin: list all (including unpublished) */
    listAll: adminProcedure.query(() => db.listAllNewsArticles()),
  }),
});

export type AppRouter = typeof appRouter;
