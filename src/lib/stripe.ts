import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      // apiVersion: "2025-02-11-preview",
      typescript: true,
    });
  }

  return stripeInstance;
}
