import { describe, expect, it } from "vitest";
import { getStripe, isStripeConfigured } from "./stripe";

describe("stripe credentials", () => {
  it("secret key is configured", () => {
    expect(isStripeConfigured()).toBe(true);
  });

  it("secret key is valid (lightweight API call)", { timeout: 20000 }, async () => {
    const stripe = getStripe();
    expect(stripe).not.toBeNull();
    // Lightweight authenticated call: list 1 balance / payment method config
    const balance = await stripe!.balance.retrieve();
    expect(balance.object).toBe("balance");
  });
});
