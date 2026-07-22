import type express from "express";
import { getStripe } from "./stripe";
import { markOrderPaid, clearCart, getOrderById } from "./db";

/**
 * Stripe webhook handler. Must be registered BEFORE express.json()
 * so we can access the raw body for signature verification.
 */
export function registerStripeWebhook(app: express.Express) {
  app.post("/api/stripe/webhook", async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.SHOP_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const rawBody = Buffer.concat(chunks);
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } else {
        // No webhook secret configured — parse JSON directly (dev fallback; payment status also synced via orders.syncStatus)
        event = JSON.parse(rawBody.toString("utf8"));
      }
    } catch (err) {
      console.error("[Stripe Webhook] signature/parse error", err);
      res.status(400).json({ error: "invalid payload" });
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as { id: string; payment_intent?: string | null; metadata?: Record<string, string> };
        const orderId = Number(session.metadata?.orderId);
        if (orderId) {
          const order = await getOrderById(orderId);
          if (order && order.status === "pending") {
            await markOrderPaid(orderId, (session.payment_intent as string) ?? null);
            await clearCart(order.userId);
          }
        }
      }
    } catch (err) {
      console.error("[Stripe Webhook] handler error", err);
    }
    res.json({ received: true });
  });
}
